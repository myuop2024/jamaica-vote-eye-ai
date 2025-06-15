
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestConnectionRequest {
  accountSid: string;
  authToken: string;
  fromNumber?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountSid, authToken, fromNumber }: TestConnectionRequest = await req.json();
    
    if (!accountSid || !authToken) {
      throw new Error('Account SID and Auth Token are required');
    }

    // Test connection by fetching account information
    const auth = btoa(`${accountSid}:${authToken}`);
    
    const accountResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    if (!accountResponse.ok) {
      const errorData = await accountResponse.json();
      throw new Error(`Twilio API error: ${errorData.message || 'Authentication failed'}`);
    }

    const accountData = await accountResponse.json();

    // If phone number is provided, validate it
    let phoneNumberValidation = null;
    if (fromNumber) {
      const phoneResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
          },
        }
      );

      if (phoneResponse.ok) {
        const phoneData = await phoneResponse.json();
        const hasPhoneNumber = phoneData.incoming_phone_numbers.some(
          (phone: any) => phone.phone_number === fromNumber
        );
        
        phoneNumberValidation = {
          isValid: hasPhoneNumber,
          message: hasPhoneNumber 
            ? 'Phone number is verified and available' 
            : 'Phone number not found in your Twilio account'
        };
      }
    }

    console.log('Twilio connection test successful:', accountData.friendly_name);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Connection successful!',
      details: {
        accountName: accountData.friendly_name,
        accountStatus: accountData.status,
        accountType: accountData.type,
        phoneNumberValidation
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error testing Twilio connection:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      message: error.message,
      details: {
        error: error.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 200, // Return 200 to avoid fetch errors, but indicate failure in body
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
