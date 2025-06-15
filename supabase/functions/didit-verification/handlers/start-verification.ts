
import { DIDIT_API_KEY, DIDIT_API_BASE_URL, DIDIT_WORKFLOW_ID, corsHeaders } from '../_shared/config.ts';

export async function handleStartVerification(supabaseClient: any, userId: string, verificationMethod: string, documentType?: string) {
  try {
    if (!DIDIT_API_KEY) throw new Error('DIDIT_API_KEY secret is not set.');
    if (!DIDIT_WORKFLOW_ID) throw new Error('DIDIT_WORKFLOW_ID secret is not set.');

    // Get user data for the session
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, email')
      .eq('id', userId)
      .single();

    if (profileError) throw new Error('User profile not found');

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

    return new Response(
      JSON.stringify({ success: true, sessionId, clientUrl, verification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error starting verification:', error);
    throw error;
  }
}
