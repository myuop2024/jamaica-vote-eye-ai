
import { SyncRequest, SyncResponse } from './types.ts';
import { readGoogleSheet } from './google-sheets-operations.ts';
import { importDataToSupabase } from './supabase-operations.ts';

export async function handleImport(request: SyncRequest): Promise<SyncResponse> {
  const { spreadsheetId, range, dataType } = request;
  
  console.log('Importing data from Google Sheets');
  
  const records = await readGoogleSheet(spreadsheetId, range);
  
  console.log(`Importing ${records.length} records from Google Sheets`);

  const importedCount = await importDataToSupabase(dataType, records);

  console.log('Import completed successfully');

  return {
    success: true,
    message: `Successfully imported ${importedCount} ${dataType} records from Google Sheets`,
    importedRecords: importedCount
  };
}
