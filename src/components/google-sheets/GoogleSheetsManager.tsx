
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, Download, Upload, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const GoogleSheetsManager: React.FC = () => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [range, setRange] = useState('A1:Z1000');
  const [dataType, setDataType] = useState<'reports' | 'observers' | 'communications'>('reports');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async (syncType: 'export' | 'import') => {
    if (!spreadsheetId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheets ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting Google Sheets sync:', { syncType, dataType, spreadsheetId, range });

      const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
        body: {
          spreadsheetId: spreadsheetId.trim(),
          range: range.trim(),
          syncType,
          dataType
        }
      });

      if (error) {
        console.error('Sync error:', error);
        throw error;
      }

      console.log('Sync result:', data);

      toast({
        title: "Success",
        description: data.message || `${syncType === 'export' ? 'Export to' : 'Import from'} Google Sheets completed successfully`
      });

    } catch (error: any) {
      console.error('Google Sheets sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || `Failed to ${syncType} data ${syncType === 'export' ? 'to' : 'from'} Google Sheets`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSpreadsheetUrlChange = (value: string) => {
    const id = extractSpreadsheetId(value);
    setSpreadsheetId(id);
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheet">Google Sheets URL or ID</Label>
              <Input
                id="spreadsheet"
                placeholder="https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit or just the Sheet ID"
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
                placeholder="A1:Z1000"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Specify the range in A1 notation (e.g., A1:Z1000, Sheet1!A1:C100)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataType">Data Type</Label>
              <Select value={dataType} onValueChange={(value: 'reports' | 'observers' | 'communications') => setDataType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reports">Observation Reports</SelectItem>
                  <SelectItem value="observers">Observer Profiles</SelectItem>
                  <SelectItem value="communications">Communications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => handleSync('export')}
              disabled={isLoading || !spreadsheetId}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isLoading ? 'Exporting...' : 'Export to Sheets'}
            </Button>

            <Button
              onClick={() => handleSync('import')}
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
              <strong>Export:</strong> Exports current data from the database to Google Sheets<br />
              <strong>Import:</strong> Imports data from Google Sheets to the database (will update existing records)
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
