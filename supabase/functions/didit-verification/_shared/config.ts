
export const DIDIT_API_BASE_URL = 'https://api.sandbox.didit.me/v1'; // Using sandbox environment
export const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
export const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
