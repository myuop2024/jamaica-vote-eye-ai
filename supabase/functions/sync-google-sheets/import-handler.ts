
import { SyncRequest, SyncResponse } from './types.ts';
import { readGoogleSheet } from './google-sheets-operations.ts';
import { importDataToSupabase } from './supabase-operations.ts';

export async function handleImport(request: SyncRequest): Promise<SyncResponse> {
  const { spreadsheetId, range, dataType } = request;
  
  console.log(`Starting import from Google Sheets: ${dataType} from ${spreadsheetId}`);
  
  try {
    // Read data from Google Sheets
    const records = await readGoogleSheet(spreadsheetId, range);
    console.log(`Read ${records.length} records from Google Sheets`);

    if (!records || records.length === 0) {
      return {
        success: false,
        message: 'No data found in the specified sheet range. Please check that the sheet contains data and the range is correct.'
      };
    }

    // Import data to Supabase
    const importedCount = await importDataToSupabase(dataType, records);
    console.log(`Successfully imported ${importedCount} records`);

    return {
      success: true,
      message: `Successfully imported ${importedCount} ${dataType} records from Google Sheets`,
      importedRecords: importedCount
    };

  } catch (error: any) {
    console.error('Import error:', error);
    
    // Return more specific error messages
    let errorMessage = `Failed to import ${dataType} from Google Sheets`;
    
    if (error.message?.includes('No data found')) {
      errorMessage = 'The specified sheet range contains no data or headers. Please verify the sheet has data and the range is correct.';
    } else if (error.message?.includes('Google Sheets API error')) {
      errorMessage = 'Unable to access the Google Sheet. Please check that the sheet ID is correct and the sheet is publicly accessible.';
    } else if (error.message?.includes('Database error')) {
      errorMessage = `Database error while importing ${dataType}: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      message: errorMessage
    };
  }
}
