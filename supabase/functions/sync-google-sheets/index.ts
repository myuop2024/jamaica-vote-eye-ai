
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  spreadsheetId: string;
  range: string;
  syncType: 'export' | 'import';
  dataType: 'reports' | 'observers' | 'communications';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spreadsheetId, range, syncType, dataType }: SyncRequest = await req.json();
    
    const googleSheetsKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!googleSheetsKey) {
      throw new Error('Google Sheets API key not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (syncType === 'export') {
      // Export data from Supabase to Google Sheets
      let data;
      switch (dataType) {
        case 'reports':
          const { data: reports } = await supabase
            .from('observation_reports')
            .select('*')
            .order('created_at', { ascending: false });
          data = reports;
          break;
        case 'observers':
          const { data: observers } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'observer');
          data = observers;
          break;
        case 'communications':
          const { data: comms } = await supabase
            .from('communications')
            .select('*')
            .order('created_at', { ascending: false });
          data = comms;
          break;
        default:
          throw new Error('Invalid data type');
      }

      if (!data || data.length === 0) {
        throw new Error('No data to export');
      }

      // Convert data to Google Sheets format
      const headers = Object.keys(data[0]);
      const values = [headers, ...data.map(row => headers.map(header => row[header] || ''))];

      // Update Google Sheets
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${googleSheetsKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error(`Google Sheets API error: ${updateResponse.statusText}`);
      }

      const result = await updateResponse.json();

      return new Response(JSON.stringify({ 
        success: true,
        message: `Exported ${data.length} ${dataType} records to Google Sheets`,
        updatedCells: result.updatedCells
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Import data from Google Sheets to Supabase
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${googleSheetsKey}`
      );

      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.statusText}`);
      }

      const sheetData = await response.json();
      const values = sheetData.values;

      if (!values || values.length < 2) {
        throw new Error('No data found in sheet');
      }

      const headers = values[0];
      const rows = values.slice(1);

      // Convert to objects
      const records = rows.map(row => {
        const record: any = {};
        headers.forEach((header: string, index: number) => {
          record[header] = row[index] || null;
        });
        return record;
      });

      // Insert into appropriate table
      let tableName = '';
      switch (dataType) {
        case 'reports':
          tableName = 'observation_reports';
          break;
        case 'observers':
          tableName = 'profiles';
          break;
        case 'communications':
          tableName = 'communications';
          break;
        default:
          throw new Error('Invalid data type');
      }

      const { error } = await supabase
        .from(tableName)
        .upsert(records);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: `Imported ${records.length} ${dataType} records from Google Sheets`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in Google Sheets sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
