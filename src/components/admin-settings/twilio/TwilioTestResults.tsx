
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { TestResult } from './types';

interface TwilioTestResultsProps {
  testResult: TestResult | null;
}

export const TwilioTestResults: React.FC<TwilioTestResultsProps> = ({ testResult }) => {
  if (!testResult) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertDescription>
            <strong>{testResult.success ? 'Success:' : 'Error:'}</strong> {testResult.message}
            {testResult.details && (
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(testResult.details, null, 2)}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
