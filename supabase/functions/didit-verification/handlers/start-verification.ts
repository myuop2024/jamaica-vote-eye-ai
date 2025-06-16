
import { DIDIT_API_KEY, DIDIT_API_BASE_URL, DIDIT_WORKFLOW_ID, corsHeaders } from '../_shared/config.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleStartVerification(supabaseClient: any, userId: string, verificationMethod: string, documentType?: string) {
  try {
    console.log('Starting verification for user:', userId, 'method:', verificationMethod, 'docType:', documentType);

    if (!DIDIT_API_KEY) {
      console.error('DIDIT_API_KEY secret is not set');
      return new Response(
        JSON.stringify({ success: false, error: 'DIDIT_API_KEY secret is not set.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!DIDIT_WORKFLOW_ID) {
      console.error('DIDIT_WORKFLOW_ID secret is not set');
      return new Response(
        JSON.stringify({ success: false, error: 'DIDIT_WORKFLOW_ID secret is not set.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Get enabled methods/types from didit_configuration
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const { data: configRows, error: configError } = await adminClient
      .from('didit_configuration')
      .select('setting_key, setting_value')
      .eq('is_active', true);
    if (configError) {
      console.error('Failed to load verification config:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to load verification config' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const configMap = configRows.reduce((acc: any, item: any) => {
      let value = item.setting_value;
      try { value = JSON.parse(value); } catch {};
      acc[item.setting_key] = value;
      return acc;
    }, {});
    
    const enabledMethods = Array.isArray(configMap.enabled_verification_methods) ? configMap.enabled_verification_methods : ['document'];
    const allowedTypes = Array.isArray(configMap.document_types_allowed) ? configMap.document_types_allowed : ['passport', 'drivers_license', 'national_id', 'voters_id'];
    
    if (!enabledMethods.includes(verificationMethod)) {
      console.error('Verification method not enabled:', verificationMethod, enabledMethods);
      return new Response(
        JSON.stringify({ success: false, error: `Verification method '${verificationMethod}' is not enabled.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (verificationMethod === 'document' && documentType && !allowedTypes.includes(documentType)) {
      console.error('Document type not enabled:', documentType, allowedTypes);
      return new Response(
        JSON.stringify({ success: false, error: `Document type '${documentType}' is not enabled.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get user data for the session
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!userProfile?.name || !userProfile?.email) {
      console.error('User profile incomplete or not found:', userId, userProfile);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile is incomplete. Name and email are required.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const projectUrl = (Deno.env.get('SUPABASE_URL') ?? '').replace('/auth/v1', '');
    const webhookUrl = `${projectUrl}/functions/v1/didit-verification`;

    // Create session using Didit's v2/session endpoint
    const sessionPayload = {
      workflow_id: DIDIT_WORKFLOW_ID,
      user_data: {
        email: userProfile.email,
        first_name: userProfile.name.split(' ')[0] || userProfile.name,
        last_name: userProfile.name.split(' ').slice(1).join(' ') || '',
      },
      metadata: {
        user_id: userId,
        verification_method: verificationMethod,
        document_type: documentType,
        webhook_url: webhookUrl
      }
    };

    console.log('Creating Didit session with payload:', JSON.stringify(sessionPayload, null, 2));

    const apiResponse = await fetch(`${DIDIT_API_BASE_URL}/session/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': DIDIT_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionPayload),
    });

    console.log('Didit API response status:', apiResponse.status, apiResponse.statusText);

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('Didit API error response:', errorData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Didit API error: ${apiResponse.status} - ${errorData}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const diditSession = await apiResponse.json();
    console.log('Didit session created successfully:', JSON.stringify(diditSession, null, 2));

    const { session_id: sessionId } = diditSession;
    // Extract the portal URL from the Didit response - it's in the 'url' property
    const clientUrl = diditSession.url;

    if (!clientUrl) {
      console.error('No verification portal URL in Didit response:', diditSession);
      return new Response(
        JSON.stringify({ success: false, error: 'Didit API did not return a verification portal URL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Extracted verification portal URL:', clientUrl);

    // Store the verification record in our database
    const { data: verification, error: dbError } = await supabaseClient
      .from('didit_verifications')
      .insert({
        user_id: userId,
        didit_session_id: sessionId,
        verification_method: verificationMethod,
        document_type: documentType,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        didit_response: diditSession,
      })
      .select().single();

    if (dbError) {
      console.error('Database error when storing verification:', dbError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create verification record' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('Verification record created successfully:', verification.id);
    console.log('Returning verification response with URL:', clientUrl);
    
    return new Response(
      JSON.stringify({ success: true, sessionId, clientUrl, verification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error starting verification (catch block):', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
