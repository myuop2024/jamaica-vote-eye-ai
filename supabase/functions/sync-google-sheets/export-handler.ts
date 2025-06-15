
import { SyncRequest, SyncResponse } from './types.ts';
import { fetchReportsData, fetchObserversData, fetchCommunicationsData } from './supabase-operations.ts';
import { clearGoogleSheet, updateGoogleSheet } from './google-sheets-operations.ts';

export async function handleExport(request: SyncRequest): Promise<SyncResponse> {
  const { spreadsheetId, range, dataType } = request;
  
  let data;
  
  switch (dataType) {
    case 'reports':
      data = await fetchReportsData();
      break;
    case 'observers':
      data = await fetchObserversData();
      break;
    case 'communications':
      data = await fetchCommunicationsData();
      break;
    default:
      throw new Error(`Invalid data type: ${dataType}`);
  }

  if (!data || data.length === 0) {
    return {
      success: true,
      message: `No ${dataType} data found to export`,
      exportedRecords: 0
    };
  }

  console.log(`Exporting ${data.length} records to Google Sheets`);

  // Clear the sheet first, then update with new data
  await clearGoogleSheet(spreadsheetId, range);
  const result = await updateGoogleSheet(spreadsheetId, range, data);

  console.log('Export completed successfully:', result);

  return {
    success: true,
    message: `Successfully exported ${data.length} ${dataType} records to Google Sheets`,
    exportedRecords: data.length,
    updatedCells: result.updatedCells
  };
}
