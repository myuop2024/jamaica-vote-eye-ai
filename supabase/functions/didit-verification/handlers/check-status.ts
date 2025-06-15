
import { corsHeaders } from '../_shared/config.ts';

export async function handleCheckVerificationStatus(supabaseClient: any, sessionId: string) {
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
