
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGoogleSheets } from '@/components/google-sheets/useGoogleSheets';

interface UserGoogleSheetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  syncType: 'export' | 'import';
  onSyncComplete?: () => void;
}

export const UserGoogleSheetsDialog: React.FC<UserGoogleSheetsDialogProps> = ({
  isOpen,
  onClose,
  syncType,
  onSyncComplete
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('Users!A1:Z1000');
  
  const { isLoading, lastResult, handleSync, extractSpreadsheetId } = useGoogleSheets();

  const handleSpreadsheetUrlChange = (value: string) => {
    const id = extractSpreadsheetId(value);
    setSpreadsheetId(id);
  };

  const handleSubmit = async () => {
    if (!spreadsheetId.trim()) {
      return;
    }

    await handleSync({
      spreadsheetId: spreadsheetId.trim(),
      range: range.trim(),
      dataType: 'observers',
      syncType
    });

    if (onSyncComplete) {
      onSyncComplete();
    }
  };

  const handleClose = () => {
    setSpreadsheetId('');
    setRange('Users!A1:Z1000');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {syncType === 'export' ? (
              <Download className="w-5 h-5" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            {syncType === 'export' ? 'Export Users to Google Sheets' : 'Import Users from Google Sheets'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {syncType === 'export' 
                ? 'This will export all user data to Google Sheets and clear existing data in the specified range.'
                : 'This will import user data from Google Sheets. Make sure the sheet has proper headers and data format.'
              }
            </AlertDescription>
          </Alert>

          {lastResult && (
            <Alert variant={lastResult.success ? "default" : "destructive"}>
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {lastResult.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="spreadsheet">Google Sheets URL or ID</Label>
            <Input
              id="spreadsheet"
              placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit"
              value={spreadsheetId}
              onChange={(e) => handleSpreadsheetUrlChange(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              You can paste the full Google Sheets URL or just the spreadsheet ID
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="range">Sheet Range</Label>
            <Input
              id="range"
              placeholder="Users!A1:Z1000"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-sm text-gray-500">
              Specify the range in A1 notation (e.g., Users!A1:Z1000, Sheet1!A1:H100)
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !spreadsheetId.trim()}
              className="flex items-center gap-2"
            >
              {syncType === 'export' ? (
                <Download className="w-4 h-4" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isLoading 
                ? (syncType === 'export' ? 'Exporting...' : 'Importing...') 
                : (syncType === 'export' ? 'Export' : 'Import')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
