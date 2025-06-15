
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
    
    console.log('Google Sheets sync request:', { spreadsheetId, range, syncType, dataType });
    
    const googleSheetsKey = Deno.env.get('GOOGLE_SHEETS_API_KEY');
    if (!googleSheetsKey) {
      console.error('Google Sheets API key not found in environment');
      throw new Error('Google Sheets API key not configured. Please add GOOGLE_SHEETS_API_KEY to your Supabase project secrets.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (syncType === 'export') {
      // Export data from Supabase to Google Sheets
      let data;
      let tableName = '';
      
      switch (dataType) {
        case 'reports':
          tableName = 'observation_reports';
          const { data: reports, error: reportsError } = await supabase
            .from('observation_reports')
            .select(`
              *,
              profiles!inner(name, email)
            `)
            .order('created_at', { ascending: false });
          
          if (reportsError) throw reportsError;
          
          // Flatten the data for Google Sheets
          data = reports?.map(report => ({
            id: report.id,
            observer_name: report.profiles?.name,
            observer_email: report.profiles?.email,
            report_text: report.report_text,
            station_id: report.station_id,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at
          }));
          break;
          
        case 'observers':
          tableName = 'profiles';
          const { data: observers, error: observersError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'observer')
            .order('created_at', { ascending: false });
          
          if (observersError) throw observersError;
          data = observers;
          break;
          
        case 'communications':
          tableName = 'communications';
          const { data: comms, error: commsError } = await supabase
            .from('communications')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (commsError) throw commsError;
          data = comms;
          break;
          
        default:
          throw new Error(`Invalid data type: ${dataType}`);
      }

      if (!data || data.length === 0) {
        return new Response(JSON.stringify({ 
          success: true,
          message: `No ${dataType} data found to export`,
          exportedRecords: 0
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Convert data to Google Sheets format
      const headers = Object.keys(data[0]);
      const values = [headers, ...data.map(row => headers.map(header => {
        const value = row[header];
        // Handle different data types for Google Sheets
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      }))];

      console.log(`Exporting ${data.length} records to Google Sheets`);

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
        const errorText = await updateResponse.text();
        console.error('Google Sheets API error:', errorText);
        throw new Error(`Google Sheets API error (${updateResponse.status}): ${errorText}`);
      }

      const result = await updateResponse.json();
      console.log('Export completed successfully:', result);

      return new Response(JSON.stringify({ 
        success: true,
        message: `Successfully exported ${data.length} ${dataType} records to Google Sheets`,
        exportedRecords: data.length,
        updatedCells: result.updatedCells
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      // Import data from Google Sheets to Supabase
      console.log('Importing data from Google Sheets');
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${googleSheetsKey}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API error:', errorText);
        throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
      }

      const sheetData = await response.json();
      const values = sheetData.values;

      if (!values || values.length < 2) {
        throw new Error('No data found in the specified sheet range. Make sure the sheet contains headers and data.');
      }

      const headers = values[0];
      const rows = values.slice(1);

      // Convert to objects
      const records = rows.map(row => {
        const record: any = {};
        headers.forEach((header: string, index: number) => {
          const value = row[index];
          record[header] = value === '' ? null : value;
        });
        return record;
      });

      console.log(`Importing ${records.length} records from Google Sheets`);

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
          throw new Error(`Invalid data type: ${dataType}`);
      }

      const { error } = await supabase
        .from(tableName)
        .upsert(records, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Import completed successfully');

      return new Response(JSON.stringify({ 
        success: true,
        message: `Successfully imported ${records.length} ${dataType} records from Google Sheets`,
        importedRecords: records.length
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
