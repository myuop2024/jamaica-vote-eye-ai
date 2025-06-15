
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SaveSettingsRequest {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountSid, authToken, fromNumber, enabled }: SaveSettingsRequest = await req.json();
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Account SID, Auth Token, and From Number are required');
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Save Twilio settings to a configuration table
    const { error: upsertError } = await supabase
      .from('didit_configuration')
      .upsert([
        {
          setting_key: 'TWILIO_ACCOUNT_SID',
          setting_value: { value: accountSid },
          description: 'Twilio Account SID for SMS service',
          is_active: enabled
        },
        {
          setting_key: 'TWILIO_AUTH_TOKEN',
          setting_value: { value: authToken },
          description: 'Twilio Auth Token for SMS service',
          is_active: enabled
        },
        {
          setting_key: 'TWILIO_FROM_NUMBER',
          setting_value: { value: fromNumber },
          description: 'Twilio From Number for sending SMS',
          is_active: enabled
        },
        {
          setting_key: 'TWILIO_ENABLED',
          setting_value: { value: enabled },
          description: 'Twilio SMS service enabled status',
          is_active: true
        }
      ], {
        onConflict: 'setting_key'
      });

    if (upsertError) {
      throw new Error(`Failed to save settings: ${upsertError.message}`);
    }

    console.log('Twilio settings saved successfully:', {
      accountSid: accountSid.substring(0, 10) + '...',
      fromNumber,
      enabled
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Twilio settings saved successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error saving Twilio settings:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      message: error.message,
      details: {
        error: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
