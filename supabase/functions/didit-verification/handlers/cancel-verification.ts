import { corsHeaders } from '../_shared/config.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function handleCancelVerification(_supabaseClient: any, verificationId: string) {
  try {
    // Use service-role client to bypass RLS for administrative cancellation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch verification to ensure it exists and is pending
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('didit_verifications')
      .select('status')
      .eq('id', verificationId)
      .single();

    if (fetchError || !verification) {
      throw new Error('Verification not found');
    }

    if (verification.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: 'Only pending verifications can be cancelled.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('didit_verifications')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', verificationId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error cancelling verification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
} 