
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

    // Gmail OAuth credentials (these would typically be stored as secrets)
    const clientId = '367771538830-8u6rjgvl06ihvam6kvkue9fvi7h7jthl.apps.googleusercontent.com';
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');

    if (!clientSecret) {
      throw new Error('Gmail client secret not configured');
    }

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
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

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
      throw dbError;
    }

    return new Response(JSON.stringify({
      success: true,
      email: userInfo.email,
      accountId: emailAccount.id
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in gmail-oauth-exchange:', error);
    
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

serve(handler);
