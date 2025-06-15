
import { corsHeaders } from '../_shared/config.ts';
import { verifyWebhookSignature } from '../_shared/verify-webhook.ts';

export async function handleDiditWebhook(supabaseClient: any, rawBody: string, signature: string | null) {
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
