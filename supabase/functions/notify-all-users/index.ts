import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const BATCH_SIZE = 100; // Process 100 users at a time

serve(async (req: Request) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, title, message, data: notificationData } = await req.json();

    if (!type || !title || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: type, title, or message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let errorOccurred = false;
    let userOffset = 0;
    let usersProcessed = 0;

    console.log(`Starting notification broadcast: "${title}"`);

    while (true) {
      const { data: users, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .range(userOffset, userOffset + BATCH_SIZE - 1);

      if (userError) {
        console.error('Error fetching users:', userError);
        errorOccurred = true;
        break;
      }

      if (!users || users.length === 0) {
        break; // No more users to process
      }

      const notificationsToInsert = users.map(user => ({
        user_id: user.id,
        type,
        title,
        message,
        data: notificationData, // Optional data field
      }));

      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsToInsert);

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        // Decide if you want to stop on first error or continue
        // For now, we'll log and continue, but mark that an error occurred
        errorOccurred = true;
      } else {
        usersProcessed += users.length;
        console.log(`Successfully inserted notifications for ${users.length} users in this batch.`);
      }

      userOffset += BATCH_SIZE;
    }

    if (errorOccurred) {
      return new Response(
        JSON.stringify({
          message: `Notification broadcast processed for ${usersProcessed} users, but some errors occurred. Check function logs.`,
          usersProcessed
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500, // Internal Server Error, as part of the job failed
        }
      );
    }

    console.log(`Successfully sent notification "${title}" to ${usersProcessed} users.`);
    return new Response(JSON.stringify({ message: `Successfully sent notification to ${usersProcessed} users.`, usersProcessed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('Critical error in notify-all-users function:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
