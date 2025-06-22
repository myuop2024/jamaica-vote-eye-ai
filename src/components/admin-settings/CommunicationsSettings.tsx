
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Save } from 'lucide-react';
import { useCommunicationsSettings } from './communications/useCommunicationsSettings';

export const CommunicationsSettings: React.FC = () => {
  const {
    settings,
    isLoading,
    isSaving,
    saveTwilioSettings,
    saveSMTPSettings
  } = useCommunicationsSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-8 h-8" />
          Communications Settings
        </h1>
        <p className="text-gray-600">Configure Twilio and SMTP provider settings</p>
      </div>

      {/* Twilio Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Twilio Configuration</CardTitle>
          <CardDescription>
            Configure Twilio settings for SMS communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            Twilio Account SID: {settings.twilio.accountSid ? '***' + settings.twilio.accountSid.slice(-4) : 'Not configured'}
          </div>
          <div className="text-sm text-gray-600">
            Phone Number: {settings.twilio.phoneNumber || 'Not configured'}
          </div>
          <div className="text-sm text-gray-600">
            Status: {settings.twilio.isConfigured ? 'Configured' : 'Not configured'}
          </div>
          <Button 
            onClick={saveTwilioSettings}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Twilio Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* SMTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>
            Configure SMTP settings for email communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            SMTP Host: {settings.smtp.host || 'Not configured'}
          </div>
          <div className="text-sm text-gray-600">
            Port: {settings.smtp.port || 'Not configured'}
          </div>
          <div className="text-sm text-gray-600">
            Username: {settings.smtp.username || 'Not configured'}
          </div>
          <div className="text-sm text-gray-600">
            Status: {settings.smtp.isConfigured ? 'Configured' : 'Not configured'}
          </div>
          <Button 
            onClick={saveSMTPSettings}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save SMTP Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
