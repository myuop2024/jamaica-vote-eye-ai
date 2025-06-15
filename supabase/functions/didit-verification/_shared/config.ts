
export const DIDIT_API_BASE_URL = 'https://verification.didit.me/v2'; // Using correct v2 API
export const DIDIT_API_KEY = Deno.env.get('DIDIT_API_KEY');
export const DIDIT_WEBHOOK_SECRET = Deno.env.get('DIDIT_WEBHOOK_SECRET');
export const DIDIT_WORKFLOW_ID = Deno.env.get('DIDIT_WORKFLOW_ID'); // Add workflow ID configuration

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
