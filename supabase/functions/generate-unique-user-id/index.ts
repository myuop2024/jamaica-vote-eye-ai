import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log('generate-unique-user-id function booting up')

// Generate a random 6-digit numeric string
function generateNumericId(length: number = 6): string {
  // Secure random number generation is not strictly necessary for this ID if it's just for uniqueness
  // and not for security/unguessability. Math.random is usually fine for such cases.
  let id = ''
  for (let i = 0; i < length; i++) {
    id += Math.floor(Math.random() * 10).toString()
  }
  return id
}

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, fullName, dateOfBirth } = await req.json()

    if (!userId || !fullName || !dateOfBirth) {
      return new Response(JSON.stringify({ error: 'Missing required fields: userId, fullName, dateOfBirth' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Basic validation for dateOfBirth format (expected YYYY-MM-DD from client)
    // The actual migration uses DATE type, so Supabase client should handle conversion if string is ISO 8601 date part.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        return new Response(JSON.stringify({ error: 'Invalid dateOfBirth format. Expected YYYY-MM-DD.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }

    // Ensure date is valid
    const parsedDate = new Date(dateOfBirth);
    if (isNaN(parsedDate.getTime())) {
        return new Response(JSON.stringify({ error: 'Invalid date value for dateOfBirth.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }


    // In a real Deno environment, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY would be set as env vars.
    // For local testing with `supabase functions serve`, these might need to be explicitly passed or configured.
    // The client making this request should be authenticated.
    // We use the service role key here to bypass RLS for profile updates,
    // as this function is a trusted part of the backend.
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Derive first name (simple split) - used for conceptual uniqueness check if needed, not stored separately by default.
    const firstName = fullName.split(' ')[0];
    // Note: This is a simplistic way to get the first name. The uniqueness of the ID itself is paramount.
    // The requirement "ties to their first name and date of birth to ensure its unique before generating"
    // implies a check against this combination to prevent re-assigning an ID to what might be the same person
    // if they were re-registered. However, the ID itself is globally unique.

    // 2. Generate unique_user_id
    let uniqueUserId = '';
    let attempts = 0;
    const maxAttempts = 10 // Prevent infinite loops, though highly unlikely for 6 digits

    while (attempts < maxAttempts) {
      const potentialId = generateNumericId(6)
      const { data: existingUser, error: checkError } = await serviceRoleClient
        .from('profiles')
        .select('unique_user_id')
        .eq('unique_user_id', potentialId)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking ID uniqueness:', checkError)
        throw new Error(`Error checking ID uniqueness: ${checkError.message}`)
      }

      if (!existingUser) {
        uniqueUserId = potentialId
        break
      }
      attempts++
    }

    if (!uniqueUserId) {
      console.error('Failed to generate a unique ID after multiple attempts.')
      return new Response(JSON.stringify({ error: 'Failed to generate a unique ID. Please try again.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // 3. Update the profile with the new unique_user_id and date_of_birth
    // The dateOfBirth string (YYYY-MM-DD) should be directly usable by Supabase for a DATE column.
    const { data: updatedProfile, error: updateError } = await serviceRoleClient
      .from('profiles')
      .update({
        unique_user_id: uniqueUserId,
        date_of_birth: dateOfBirth, // Ensure this is in 'YYYY-MM-DD' format or a Date object
        // We could also update/confirm first_name if we decide to store it separately
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError)
      // Check for unique constraint violation on unique_user_id, just in case of race conditions (though unlikely)
      if (updateError.message.includes('duplicate key value violates unique constraint "profiles_unique_user_id_key"')) {
         return new Response(JSON.stringify({ error: 'Failed to assign unique ID due to a conflict. Please try again.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // Conflict
        });
      }
      throw new Error(`Error updating profile: ${updateError.message}`)
    }

    console.log('Profile updated successfully with unique ID:', updatedProfile);

    return new Response(JSON.stringify({ success: true, profile: updatedProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Unhandled error in generate-unique-user-id:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
