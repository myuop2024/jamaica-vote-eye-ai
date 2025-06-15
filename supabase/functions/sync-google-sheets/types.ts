
export interface SyncRequest {
  spreadsheetId: string;
  range: string;
  syncType: 'export' | 'import';
  dataType: 'reports' | 'observers' | 'communications';
}

export interface SyncResponse {
  success: boolean;
  message: string;
  exportedRecords?: number;
  importedRecords?: number;
  updatedCells?: number;
}

export interface GoogleSheetsConfig {
  apiKey: string;
  baseUrl: string;
}

export interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}
