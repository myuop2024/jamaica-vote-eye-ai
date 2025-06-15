
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
  
  const response = await fetch(
    `${config.baseUrl}/${spreadsheetId}/values/${range}?key=${config.apiKey}`
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

  return records;
}
