import { DIDIT_API_KEY, DIDIT_API_BASE_URL, DIDIT_WORKFLOW_ID, corsHeaders } from '../_shared/config.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleStartVerification(supabaseClient: any, userId: string, verificationMethod: string, documentType?: string) {
  try {
    if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY secret is not set.');
    if (!DIDIT_WORKFLOW_ID) throw new Error('DIDIT_WORKFLOW_ID secret is not set.');

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
      throw new Error('Failed to load verification config');
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
    if (profileError || !userProfile?.name || !userProfile?.email) {
      console.error('User profile incomplete or not found:', userId, userProfile, profileError);
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

    console.log('Creating Didit session with payload:', sessionPayload);

    const apiResponse = await fetch(`${DIDIT_API_BASE_URL}/session/`, {
      method: 'POST',
      headers: {
        'X-Api-Key': DIDIT_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sessionPayload),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error('Didit API error:', errorData);
      throw new Error(`Didit API error: ${apiResponse.status} - ${errorData}`);
    }

    const diditSession = await apiResponse.json();
    console.log('Didit session created:', diditSession);

    const { session_id: sessionId, verification_url: clientUrl } = diditSession;

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
      console.error('Database error:', dbError);
      throw new Error('Failed to create verification record');
    }

    console.log('Returning verification response:', { success: true, sessionId, clientUrl, verification });
    return new Response(
      JSON.stringify({ success: true, sessionId, clientUrl, verification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error starting verification (catch):', error);
    throw error;
  }
}
