import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from './_shared/config.ts'
import { handleTestConnection } from './handlers/test-connection.ts'
import { handleStartVerification } from './handlers/start-verification.ts'
import { handleCheckVerificationStatus } from './handlers/check-status.ts'
import { handleDiditWebhook } from './handlers/handle-webhook.ts'
import { handleCancelVerification } from './handlers/cancel-verification.ts'

// Updated: Added cancel verification functionality

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody || '{}');
    const { action } = body;

    console.log('Didit verification request:', { action, method: req.method, hasBody: !!rawBody });

    // Webhooks are unauthenticated and should use the service role key
    if (action === 'webhook' || req.method === 'POST' && !action) {
      const signature = req.headers.get('x-didit-signature-256') || req.headers.get('x-didit-signature');
      const supabaseAdminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );
      return await handleDiditWebhook(supabaseAdminClient, rawBody, signature);
    }

    // All other actions require user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const { verification_method, document_type, user_id, session_id, verification_id } = body;

    switch (action) {
      case 'test_connection':
        return await handleTestConnection();
      
      case 'start_verification':
        // Ensure the user can only start verification for themselves
        if (user.id !== user_id) {
          throw new Error("User can only start verification for themselves.");
        }
        return await handleStartVerification(supabaseClient, user_id, verification_method, document_type);
      
      case 'check_status':
        return await handleCheckVerificationStatus(supabaseClient, session_id);
      
      case 'cancel_verification':
        console.log('Cancel verification action:', { user_id, verification_id, currentUserId: user.id });
        // Allow admins to cancel any verification or users to cancel their own pending verification
        if (user.id !== user_id) {
          // Check if user has admin role
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          console.log('Admin check:', { profile, userRole: profile?.role });

          if (profile?.role !== 'admin') {
            throw new Error('Only admins can cancel other users\' verifications.');
          }
        }
        console.log('Calling handleCancelVerification with:', verification_id || session_id || '');
        return await handleCancelVerification(supabaseClient, verification_id || session_id || '');
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('Error in didit-verification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
