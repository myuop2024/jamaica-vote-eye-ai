
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SyncRequest, SyncResult } from './types';

export const useGoogleSheets = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleSync = async (request: SyncRequest) => {
    if (!request.spreadsheetId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheets ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      console.log('Starting Google Sheets sync:', request);

      const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
        body: {
          spreadsheetId: request.spreadsheetId.trim(),
          range: request.range.trim(),
          syncType: request.syncType,
          dataType: request.dataType
        }
      });

      if (error) {
        console.error('Sync error:', error);
        throw new Error(error.message || 'Failed to sync with Google Sheets');
      }

      console.log('Sync result:', data);

      const result = {
        success: true,
        message: data.message || `${request.syncType === 'export' ? 'Export to' : 'Import from'} Google Sheets completed successfully`
      };

      setLastResult(result);

      toast({
        title: "Success",
        description: result.message
      });

    } catch (error: any) {
      console.error('Google Sheets sync error:', error);
      
      const result = {
        success: false,
        message: error.message || `Failed to ${request.syncType} data ${request.syncType === 'export' ? 'to' : 'from'} Google Sheets`
      };

      setLastResult(result);

      toast({
        title: "Sync Failed",
        description: result.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    lastResult,
    handleSync,
    extractSpreadsheetId
  };
};
