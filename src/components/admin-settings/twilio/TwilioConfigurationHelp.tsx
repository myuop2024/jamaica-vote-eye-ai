
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const TwilioConfigurationHelp: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuration Help</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-2">
          <p><strong>Account SID:</strong> Your primary Twilio identifier (starts with AC)</p>
          <p><strong>Auth Token:</strong> Your secret authentication token from Twilio Console</p>
          <p><strong>From Number:</strong> Your verified Twilio phone number for sending SMS</p>
          <p><strong>Webhook URL:</strong> Optional endpoint to receive delivery status updates</p>
          <p><strong>Status Callback:</strong> Optional endpoint to receive message status changes</p>
        </div>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Settings are now securely stored in the database. 
            Make sure to save your configuration and test the connection before sending SMS messages.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
