
import { GoogleSheetsConfig, SupabaseConfig } from './types.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function getGoogleSheetsConfig(): GoogleSheetsConfig {
  const apiKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
  if (!apiKey) {
    throw new Error('Google Sheets API key not configured. Please add GOOGLE_SHEETS_API_KEY to your Supabase project secrets.');
  }
  
  return {
    apiKey,
    baseUrl: 'https://sheets.googleapis.com/v4/spreadsheets'
  };
}

export function getSupabaseConfig(): SupabaseConfig {
  return {
    url: Deno.env.get('SUPABASE_URL') ?? '',
    serviceRoleKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  };
}
