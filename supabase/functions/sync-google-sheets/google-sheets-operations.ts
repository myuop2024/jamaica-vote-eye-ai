
import { getGoogleSheetsConfig } from './config.ts';

export async function clearGoogleSheet(spreadsheetId: string, range: string) {
  const config = getGoogleSheetsConfig();
  
  const clearResponse = await fetch(
    `${config.baseUrl}/${spreadsheetId}/values/${range}:clear?key=${config.apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!clearResponse.ok) {
    const errorText = await clearResponse.text();
    console.error('Google Sheets clear error:', errorText);
    throw new Error(`Failed to clear sheet: ${errorText}`);
  }
}

export async function updateGoogleSheet(spreadsheetId: string, range: string, data: any[]) {
  const config = getGoogleSheetsConfig();
  
  if (!data || data.length === 0) {
    throw new Error('No data provided to update sheet');
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

  const updateResponse = await fetch(
    `${config.baseUrl}/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${config.apiKey}`,
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

  return await updateResponse.json();
}

export async function readGoogleSheet(spreadsheetId: string, range: string) {
  const config = getGoogleSheetsConfig();
  
  console.log(`Reading from Google Sheets: ${spreadsheetId}, range: ${range}`);
  
  const response = await fetch(
    `${config.baseUrl}/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${config.apiKey}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google Sheets API error:', errorText);
    
    if (response.status === 403) {
      throw new Error('Access denied to Google Sheets. Please ensure the sheet is publicly accessible or shared with the service account.');
    } else if (response.status === 404) {
      throw new Error('Google Sheet not found. Please check the spreadsheet ID and ensure the sheet exists.');
    } else if (response.status === 400) {
      throw new Error('Invalid range specified. Please check the sheet name and range format (e.g., Sheet1!A1:Z1000).');
    }
    
    throw new Error(`Google Sheets API error (${response.status}): ${errorText}`);
  }

  const sheetData = await response.json();
  const values = sheetData.values;

  if (!values || values.length === 0) {
    throw new Error('No data found in the specified sheet range. Please verify that the sheet contains data and the range is correct.');
  }

  if (values.length < 2) {
    throw new Error('Sheet must contain at least a header row and one data row. Please add data to the sheet.');
  }

  const headers = values[0].map((header: string) => header?.toString().trim()).filter(Boolean);
  const rows = values.slice(1);

  if (headers.length === 0) {
    throw new Error('No valid headers found in the first row. Please ensure the first row contains column headers.');
  }

  // Convert to objects, handling empty cells and mismatched row lengths
  const records = rows
    .filter((row: any[]) => row && row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== ''))
    .map((row: any[]) => {
      const record: any = {};
      headers.forEach((header: string, index: number) => {
        const value = row[index];
        // Handle empty cells and convert to appropriate types
        if (value === undefined || value === null || value === '') {
          record[header] = null;
        } else {
          record[header] = String(value).trim();
        }
      });
      return record;
    });

  console.log(`Successfully read ${records.length} records from Google Sheets`);
  return records;
}
