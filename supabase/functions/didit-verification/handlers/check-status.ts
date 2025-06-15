
import { DIDIT_API_KEY, DIDIT_API_BASE_URL, corsHeaders } from '../_shared/config.ts';

export async function handleCheckVerificationStatus(supabaseClient: any, sessionId: string) {
  try {
    // First check our local database
    const { data: verification, error: dbError } = await supabaseClient
      .from('didit_verifications')
      .select('*')
      .eq('didit_session_id', sessionId)
      .single();

    if (dbError || !verification) {
      throw new Error('Verification not found');
    }

    // If status is still pending, poll Didit for updates
    if (verification.status === 'pending' && DIDIT_API_KEY) {
      try {
        const response = await fetch(`${DIDIT_API_BASE_URL}/session/${sessionId}`, {
          headers: { 'X-Api-Key': DIDIT_API_KEY }
        });

        if (response.ok) {
          const sessionData = await response.json();
          console.log('Didit session status:', sessionData);

          // Update our database if status has changed
          if (sessionData.status !== verification.status) {
            const { error: updateError } = await supabaseClient
              .from('didit_verifications')
              .update({
                status: sessionData.status,
                didit_response: sessionData,
                updated_at: new Date().toISOString(),
                verified_at: sessionData.status === 'success' ? new Date().toISOString() : null,
              })
              .eq('didit_session_id', sessionId);

            if (!updateError) {
              verification.status = sessionData.status;
              verification.didit_response = sessionData;
            }
          }
        }
      } catch (pollError) {
        console.warn('Failed to poll Didit status:', pollError);
        // Continue with database status if polling fails
      }
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
