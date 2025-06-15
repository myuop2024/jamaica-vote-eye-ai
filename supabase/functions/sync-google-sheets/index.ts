
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from './config.ts';
import { SyncRequest } from './types.ts';
import { handleExport } from './export-handler.ts';
import { handleImport } from './import-handler.ts';

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const syncRequest: SyncRequest = await req.json();
    
    console.log('Google Sheets sync request:', syncRequest);
    
    let result;
    
    if (syncRequest.syncType === 'export') {
      result = await handleExport(syncRequest);
    } else {
      result = await handleImport(syncRequest);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in Google Sheets sync:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Check the function logs for more information'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
