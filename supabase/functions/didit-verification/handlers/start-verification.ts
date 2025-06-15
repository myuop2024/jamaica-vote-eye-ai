
import { DIDIT_API_KEY, DIDIT_API_BASE_URL, corsHeaders } from '../_shared/config.ts';

export async function handleStartVerification(supabaseClient: any, userId: string, verificationMethod: string, documentType?: string) {
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
