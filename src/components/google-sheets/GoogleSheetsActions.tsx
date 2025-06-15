
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SyncRequest } from './types';

interface GoogleSheetsActionsProps {
  spreadsheetId: string;
  range: string;
  dataType: 'reports' | 'observers' | 'communications';
  isLoading: boolean;
  onSync: (request: SyncRequest) => void;
}

export const GoogleSheetsActions: React.FC<GoogleSheetsActionsProps> = ({
  spreadsheetId,
  range,
  dataType,
  isLoading,
  onSync
}) => {
  const handleExport = () => {
    onSync({
      spreadsheetId,
      range,
      dataType,
      syncType: 'export'
    });
  };

  const handleImport = () => {
    onSync({
      spreadsheetId,
      range,
      dataType,
      syncType: 'import'
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleExport}
          disabled={isLoading || !spreadsheetId}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isLoading ? 'Exporting...' : 'Export to Sheets'}
        </Button>

        <Button
          onClick={handleImport}
          disabled={isLoading || !spreadsheetId}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isLoading ? 'Importing...' : 'Import from Sheets'}
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Export:</strong> Exports current data from the database to Google Sheets (clears existing data first)<br />
          <strong>Import:</strong> Imports data from Google Sheets to the database (will update existing records based on ID)
        </AlertDescription>
      </Alert>
    </div>
  );
};
