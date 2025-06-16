
// Version: 26 - Enhanced error handling and debugging
// Last updated: 2024-01-16T04:35:00.000Z

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Import configuration
import { corsHeaders } from './_shared/config.ts'

// Import handlers
import { handleTestConnection } from './handlers/test-connection.ts'
import { handleStartVerification } from './handlers/start-verification.ts'
import { handleCheckVerificationStatus } from './handlers/check-status.ts'
import { handleDiditWebhook } from './handlers/handle-webhook.ts'
import { handleCancelVerification } from './handlers/cancel-verification.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    let body = {};
    
    try {
      body = JSON.parse(rawBody || '{}');
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { action } = body as any;

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError.message }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }
    
    if (!user) {
      console.error('No user found in auth context');
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    console.log('Authenticated user:', user.id);

    const { verification_method, document_type, user_id, session_id, verification_id } = body as any;

    switch (action) {
      case 'test_connection':
        return await handleTestConnection();
      
      case 'start_verification':
        // Ensure the user can only start verification for themselves
        if (user.id !== user_id) {
          console.error('User ID mismatch:', { authUserId: user.id, requestedUserId: user_id });
          return new Response(
            JSON.stringify({ error: 'User can only start verification for themselves' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
          );
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
            return new Response(
              JSON.stringify({ error: 'Only admins can cancel other users\' verifications' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
            );
          }
        }
        console.log('Calling handleCancelVerification with:', verification_id || session_id || '');
        return await handleCancelVerification(supabaseClient, verification_id || session_id || '');
      
      default:
        console.error('Invalid action:', action);
        return new Response(
          JSON.stringify({ error: `Invalid action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
        );
    }
  } catch (error) {
    console.error('Error in didit-verification function:', error);
    
    // Return a proper error response with more details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error stack:', errorStack);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
