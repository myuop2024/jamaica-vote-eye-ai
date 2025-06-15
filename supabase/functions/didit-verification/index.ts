
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the user from the request
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, verification_method, document_type, user_id, session_id } = await req.json()

    console.log('Didit verification request:', { action, verification_method, document_type, user_id })

    switch (action) {
      case 'start_verification':
        return await startVerification(supabaseClient, user_id, verification_method, document_type)
      
      case 'webhook':
        return await handleWebhook(supabaseClient, req)
      
      case 'check_status':
        return await checkVerificationStatus(supabaseClient, session_id)
      
      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in didit-verification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function startVerification(
  supabaseClient: any,
  userId: string,
  verificationMethod: string,
  documentType?: string
) {
  try {
    // For demo purposes, we'll simulate the didit API call
    // In production, you would call the actual didit API here
    const mockSessionId = `didit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create verification record in database
    const { data: verification, error: dbError } = await supabaseClient
      .from('didit_verifications')
      .insert({
        user_id: userId,
        didit_session_id: mockSessionId,
        verification_method: verificationMethod,
        document_type: documentType,
        status: 'pending',
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to create verification record')
    }

    // In production, replace this with actual didit API endpoint
    const mockClientUrl = `https://verify.didit.me/session/${mockSessionId}?redirect_url=${encodeURIComponent('https://your-app.com/verification-complete')}`

    console.log('Verification started:', { sessionId: mockSessionId, verification })

    return new Response(
      JSON.stringify({
        success: true,
        sessionId: mockSessionId,
        clientUrl: mockClientUrl,
        verification: verification
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error starting verification:', error)
    throw error
  }
}

async function handleWebhook(supabaseClient: any, req: Request) {
  try {
    // This would handle webhooks from didit when verification is complete
    const webhookData = await req.json()
    console.log('Received didit webhook:', webhookData)

    // Extract verification data from webhook
    const { session_id, status, confidence_score, extracted_data, verification_metadata } = webhookData

    // Update verification record
    const { error: updateError } = await supabaseClient
      .from('didit_verifications')
      .update({
        status: status,
        confidence_score: confidence_score,
        extracted_data: extracted_data,
        verification_metadata: verification_metadata,
        didit_response: webhookData,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('didit_session_id', session_id)

    if (updateError) {
      console.error('Error updating verification:', updateError)
      throw new Error('Failed to update verification record')
    }

    // Update user's profile verification status if verified
    if (status === 'verified' && confidence_score >= 0.8) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({
          didit_verification_status: 'verified',
          didit_verification_date: new Date().toISOString(),
          didit_confidence_score: confidence_score
        })
        .eq('id', webhookData.user_id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error handling webhook:', error)
    throw error
  }
}

async function checkVerificationStatus(supabaseClient: any, sessionId: string) {
  try {
    const { data: verification, error } = await supabaseClient
      .from('didit_verifications')
      .select('*')
      .eq('didit_session_id', sessionId)
      .single()

    if (error) {
      throw new Error('Verification not found')
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification: verification
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error checking verification status:', error)
    throw error
  }
}
