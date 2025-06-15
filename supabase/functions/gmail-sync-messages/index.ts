
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncMessagesRequest {
  accountId: string;
  maxResults?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId, maxResults = 10 }: SyncMessagesRequest = await req.json();

    if (!accountId) {
      throw new Error('Account ID is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get email account details
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      throw new Error('Email account not found');
    }

    // Check if access token is expired and refresh if needed
    let accessToken = account.access_token;
    if (account.token_expires_at && new Date(account.token_expires_at) <= new Date()) {
      accessToken = await refreshAccessToken(account.refresh_token, supabase, accountId);
    }

    // Fetch messages from Gmail API
    const gmailResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!gmailResponse.ok) {
      throw new Error(`Gmail API error: ${gmailResponse.statusText}`);
    }

    const gmailData = await gmailResponse.json();
    const messages = gmailData.messages || [];

    // Fetch detailed message data and store in database
    const syncedMessages = [];
    for (const message of messages) {
      try {
        const messageDetail = await fetchMessageDetail(message.id, accessToken);
        const dbMessage = await storeMessage(messageDetail, accountId, supabase);
        if (dbMessage) {
          syncedMessages.push(dbMessage);
        }
      } catch (error) {
        console.error(`Error syncing message ${message.id}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      syncedCount: syncedMessages.length,
      totalMessages: messages.length
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in gmail-sync-messages:', error);
    
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

async function refreshAccessToken(refreshToken: string, supabase: any, accountId: string): Promise<string> {
  const clientId = '367771538830-8u6rjgvl06ihvam6kvkue9fvi7h7jthl.apps.googleusercontent.com';
  const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');

  if (!clientSecret) {
    throw new Error('Gmail client secret not configured');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await tokenResponse.json();

  // Update the account with new access token
  await supabase
    .from('email_accounts')
    .update({
      access_token: tokenData.access_token,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    })
    .eq('id', accountId);

  return tokenData.access_token;
}

async function fetchMessageDetail(messageId: string, accessToken: string) {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch message ${messageId}`);
  }

  return await response.json();
}

async function storeMessage(messageData: any, accountId: string, supabase: any) {
  const headers = messageData.payload?.headers || [];
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

  const subject = getHeader('Subject');
  const fromEmail = getHeader('From');
  const toEmails = getHeader('To').split(',').map((email: string) => email.trim());
  const ccEmails = getHeader('Cc').split(',').filter(Boolean).map((email: string) => email.trim());
  const date = getHeader('Date');

  // Extract body text
  let bodyText = '';
  let bodyHtml = '';
  
  if (messageData.payload?.body?.data) {
    bodyText = atob(messageData.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  } else if (messageData.payload?.parts) {
    for (const part of messageData.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }
  }

  // Parse from email to get name and email
  const fromMatch = fromEmail.match(/^(.+?)\s*<(.+)>$/) || [null, '', fromEmail];
  const fromName = fromMatch[1]?.trim().replace(/^"(.*)"$/, '$1') || '';
  const fromEmailClean = fromMatch[2] || fromEmail;

  const messageRecord = {
    email_account_id: accountId,
    message_id: messageData.id,
    thread_id: messageData.threadId,
    subject: subject || null,
    from_email: fromEmailClean,
    from_name: fromName || null,
    to_emails: toEmails,
    cc_emails: ccEmails,
    body_text: bodyText || null,
    body_html: bodyHtml || null,
    is_read: !messageData.labelIds?.includes('UNREAD'),
    is_sent: messageData.labelIds?.includes('SENT') || false,
    has_attachments: messageData.payload?.parts?.some((part: any) => part.filename) || false,
    labels: messageData.labelIds || [],
    received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('email_messages')
    .upsert(messageRecord, { 
      onConflict: 'email_account_id,message_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing message:', error);
    return null;
  }

  return data;
}

serve(handler);
