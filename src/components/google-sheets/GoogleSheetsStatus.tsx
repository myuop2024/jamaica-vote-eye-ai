
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { SyncResult } from './types';

interface GoogleSheetsStatusProps {
  lastResult: SyncResult | null;
}

export const GoogleSheetsStatus: React.FC<GoogleSheetsStatusProps> = ({ lastResult }) => {
  if (!lastResult) return null;

  return (
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
  );
};
