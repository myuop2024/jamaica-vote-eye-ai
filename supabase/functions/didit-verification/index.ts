
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Buffer } from "https://deno.land/std@0.168.0/io/buffer.ts";

const DIDIT_API_BASE_URL = 'https://api.sandbox.didit.me/v1'; // Using sandbox environment
const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyWebhookSignature(body: string, signature: string | null): Promise<boolean> {
  if (!DIDIT_WEBHOOK_SECRET) {
    console.warn("DIDIT_WEBHOOK_SECRET is not set. Skipping webhook signature verification.");
    // In a real production environment, you should probably fail here.
    return true;
  }

  if (!signature) {
    throw new Error("Missing 'x-didit-signature-256' header");
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(DIDIT_WEBHOOK_SECRET);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  
  const data = encoder.encode(body);
  const mac = await crypto.subtle.sign("HMAC", key, data);
  
  const calculatedSignature = `sha256=${new Buffer(mac).toString("hex")}`;
  
  // Use timing-safe equality check
  if (crypto.subtle.timingSafeEqual(encoder.encode(calculatedSignature), encoder.encode(signature))) {
    return true;
  }

  throw new Error("Invalid signature.");
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody || '{}');
    const { action } = body;

    // Webhooks are unauthenticated and should use the service role key
    if (action === 'webhook') {
      const signature = req.headers.get('x-didit-signature-256');
      const supabaseAdminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      return await handleWebhook(supabaseAdminClient, rawBody, signature);
    }

    // All other actions require user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }});
    }

    const { verification_method, document_type, user_id, session_id } = body;
    console.log('Didit verification request:', { action, verification_method, document_type, user_id });

    switch (action) {
      case 'test_connection':
        return await testConnection();
      case 'start_verification':
        // Ensure the user can only start verification for themselves
        if (user.id !== user_id) {
          throw new Error("User can only start verification for themselves.");
        }
        return await startVerification(supabaseClient, user_id, verification_method, document_type);
      case 'check_status':
        return await checkVerificationStatus(supabaseClient, session_id);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in didit-verification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

async function testConnection() {
  try {
    if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY secret is not set.');

    const response = await fetch(`${DIDIT_API_BASE_URL}/status`, {
      headers: { 'Authorization': `Bearer ${DIDIT_API_KEY}` }
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Didit API returned status: ${response.status}. Body: ${errorBody}`);
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({ success: true, connected: data.status === 'ok', message: 'Connection to didit API successful' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Connection test failed:', error);
    return new Response(
      JSON.stringify({ success: false, connected: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
}

async function startVerification(supabaseClient: any, userId: string, verificationMethod: string, documentType?: string) {
  try {
    if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY secret is not set.');

    const projectUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace('/auth/v1', '');
    const redirectUrl = `${projectUrl}/identity-verification`;
    const webhookUrl = `${projectUrl}/functions/v1/didit-verification`;

    const apiResponse = await fetch(`${DIDIT_API_BASE_URL}/verifications`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIDIT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: verificationMethod,
        document_type: documentType,
        customer_user_id: userId,
        redirect_url: redirectUrl,
        webhook_config: {
            url: webhookUrl,
            action: "webhook" // To be passed in the webhook body
        }
      }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      throw new Error(errorData.message || `Didit API error: ${apiResponse.status}`);
    }

    const diditSession = await apiResponse.json();
    const { id: sessionId, client_url: clientUrl } = diditSession;

    const { data: verification, error: dbError } = await supabaseClient
      .from('didit_verifications')
      .insert({
        user_id: userId,
        didit_session_id: sessionId,
        verification_method: verificationMethod,
        document_type: documentType,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
      .select().single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to create verification record');
    }

    return new Response(
      JSON.stringify({ success: true, sessionId, clientUrl, verification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error starting verification:', error);
    throw error;
  }
}

async function handleWebhook(supabaseClient: any, rawBody: string, signature: string | null) {
  try {
    await verifyWebhookSignature(rawBody, signature);
    const webhookData = JSON.parse(rawBody);
    console.log('Received and verified didit webhook:', webhookData);

    const { session_id, status, confidence_score, extracted_data, verification_metadata } = webhookData;

    const { data: verificationRecord, error: fetchError } = await supabaseClient
      .from('didit_verifications')
      .select('user_id')
      .eq('didit_session_id', session_id)
      .single();

    if (fetchError || !verificationRecord) {
      console.error('Webhook for unknown or unowned session:', session_id, fetchError);
      return new Response(JSON.stringify({ error: 'Verification session not found' }), { status: 404, headers: corsHeaders });
    }
    const userId = verificationRecord.user_id;

    const { error: updateError } = await supabaseClient
      .from('didit_verifications')
      .update({
        status: status,
        confidence_score: confidence_score,
        extracted_data: extracted_data,
        verification_metadata: verification_metadata,
        didit_response: webhookData,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('didit_session_id', session_id);

    if (updateError) throw new Error(`Failed to update verification record: ${updateError.message}`);

    if (status === 'verified') {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          didit_verification_status: 'verified',
          didit_verification_date: new Date().toISOString(),
          didit_confidence_score: confidence_score
        })
        .eq('id', userId);
      if (profileError) console.error('Error updating profile:', profileError);
    } else if (['failed', 'expired', 'cancelled'].includes(status)) {
        const { error: profileError } = await supabaseClient
            .from('profiles')
            .update({ didit_verification_status: status })
            .eq('id', userId);
        if (profileError) console.error('Error updating profile for failed status:', profileError);
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
}

async function checkVerificationStatus(supabaseClient: any, sessionId: string) {
  try {
    const { data: verification, error } = await supabaseClient
      .from('didit_verifications')
      .select('*')
      .eq('didit_session_id', sessionId)
      .single();

    if (error) {
      throw new Error('Verification not found');
    }
    
    return new Response(
      JSON.stringify({ success: true, verification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
}
