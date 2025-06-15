
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { useGoogleSheets } from './useGoogleSheets';
import { GoogleSheetsForm } from './GoogleSheetsForm';
import { GoogleSheetsActions } from './GoogleSheetsActions';
import { GoogleSheetsStatus } from './GoogleSheetsStatus';
import { GoogleSheetsFormData } from './types';

export const GoogleSheetsManager: React.FC = () => {
  const [formData, setFormData] = useState<GoogleSheetsFormData>({
    spreadsheetId: '',
    range: 'Sheet1!A1:Z1000',
    dataType: 'reports'
  });

  const { isLoading, lastResult, handleSync, extractSpreadsheetId } = useGoogleSheets();

  const handleSpreadsheetUrlChange = (value: string) => {
    const id = extractSpreadsheetId(value);
    setFormData(prev => ({ ...prev, spreadsheetId: id }));
  };

  const handleRangeChange = (value: string) => {
    setFormData(prev => ({ ...prev, range: value }));
  };

  const handleDataTypeChange = (value: 'reports' | 'observers' | 'communications') => {
    setFormData(prev => ({ ...prev, dataType: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Google Sheets Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Setup Required:</strong> Make sure you have a Google Sheets API key configured in your Supabase project settings.
              The sheet must be publicly accessible or shared with the service account.
            </AlertDescription>
          </Alert>

          <GoogleSheetsStatus lastResult={lastResult} />

          <GoogleSheetsForm
            formData={formData}
            onSpreadsheetUrlChange={handleSpreadsheetUrlChange}
            onRangeChange={handleRangeChange}
            onDataTypeChange={handleDataTypeChange}
            isLoading={isLoading}
          />

          <Separator />

          <GoogleSheetsActions
            spreadsheetId={formData.spreadsheetId}
            range={formData.range}
            dataType={formData.dataType}
            isLoading={isLoading}
            onSync={handleSync}
          />
        </CardContent>
      </Card>
    </div>
  );
};
