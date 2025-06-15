
export interface SyncRequest {
  spreadsheetId: string;
  range: string;
  syncType: 'export' | 'import';
  dataType: 'reports' | 'observers' | 'communications';
}

export interface SyncResult {
  success: boolean;
  message: string;
}

export interface GoogleSheetsFormData {
  spreadsheetId: string;
  range: string;
  dataType: 'reports' | 'observers' | 'communications';
}
