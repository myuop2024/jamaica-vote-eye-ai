
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  to: string;
  message: string;
  campaignId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, campaignId }: SMSRequest = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve Twilio configuration from database
    const { data: configData, error: configError } = await supabase
      .from('didit_configuration')
      .select('setting_key, setting_value, is_active')
      .in('setting_key', ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER', 'TWILIO_ENABLED'])
      .eq('is_active', true);

    if (configError) {
      throw new Error(`Failed to retrieve Twilio configuration: ${configError.message}`);
    }

    if (!configData || configData.length === 0) {
      throw new Error('Twilio configuration not found. Please configure Twilio settings first.');
    }

    // Parse configuration
    const config = configData.reduce((acc, item) => {
      acc[item.setting_key] = item.setting_value.value;
      return acc;
    }, {} as Record<string, any>);

    const twilioAccountSid = config.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = config.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = config.TWILIO_FROM_NUMBER;
    const twilioEnabled = config.TWILIO_ENABLED;

    if (!twilioEnabled) {
      throw new Error('Twilio SMS service is currently disabled');
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
      throw new Error('Twilio configuration incomplete. Please check your settings.');
    }

    // Send SMS via Twilio
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const formData = new FormData();
    formData.append('To', to);
    formData.append('From', twilioFromNumber);
    formData.append('Body', message);

    const smsResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
        body: formData,
      }
    );

    const result = await smsResponse.json();

    if (!smsResponse.ok) {
      throw new Error(`Twilio error: ${result.message || 'Unknown error'}`);
    }

    // Create SMS log table entry if it doesn't exist
    const { error: logError } = await supabase
      .from('sms_logs')
      .insert({
        to_number: to,
        message_content: message,
        campaign_id: campaignId,
        twilio_sid: result.sid,
        status: result.status,
        sent_at: new Date().toISOString()
      });

    // If sms_logs table doesn't exist, we'll ignore the error for now
    if (logError && !logError.message.includes('does not exist')) {
      console.warn('Failed to log SMS:', logError.message);
    }

    console.log('SMS sent successfully:', result.sid);

    return new Response(JSON.stringify({ 
      success: true, 
      messageSid: result.sid,
      status: result.status 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
