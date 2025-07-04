
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OAuthExchangeRequest {
  code: string;
  userId: string;
  redirectUri: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, userId, redirectUri }: OAuthExchangeRequest = await req.json();

    if (!code || !userId || !redirectUri) {
      throw new Error('Missing required parameters');
    }

    // Gmail OAuth credentials - using environment variables
    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      console.error('Missing Gmail OAuth credentials:', { 
        hasClientId: !!clientId, 
        hasClientSecret: !!clientSecret 
      });
      throw new Error('Gmail OAuth credentials not configured properly');
    }

    console.log('OAuth exchange attempt:', {
      redirectUri,
      clientId: clientId.substring(0, 10) + '...',
      codeLength: code.length
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData
      });
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Gmail API
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', userInfoResponse.status);
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

    // Test Gmail API access
    const gmailTestResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!gmailTestResponse.ok) {
      console.error('Failed to access Gmail API:', gmailTestResponse.status);
      throw new Error('Failed to access Gmail API - insufficient permissions');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store email account in database
    const { data: emailAccount, error: dbError } = await supabase
      .from('email_accounts')
      .upsert({
        user_id: userId,
        email_address: userInfo.email,
        provider: 'gmail',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id,email_address'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Gmail account connected successfully:', userInfo.email);

    // Close the popup window by posting a message
    const responseHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gmail Connected</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GMAIL_OAUTH_SUCCESS',
                data: {
                  email: '${userInfo.email}',
                  accountId: '${emailAccount.id}'
                }
              }, window.location.origin);
              window.close();
            } else {
              document.body.innerHTML = '<h1>Gmail account connected successfully!</h1><p>You can close this window.</p>';
            }
          </script>
        </body>
      </html>
    `;

    return new Response(responseHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in gmail-oauth-exchange:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gmail Connection Error</title>
        </head>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'GMAIL_OAUTH_ERROR',
                error: '${error.message}'
              }, window.location.origin);
              window.close();
            } else {
              document.body.innerHTML = '<h1>Error connecting Gmail</h1><p>${error.message}</p>';
            }
          </script>
        </body>
      </html>
    `;
    
    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
