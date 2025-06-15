
import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { TwilioStatusBadge } from './twilio/TwilioStatusBadge';
import { TwilioConfigurationForm } from './twilio/TwilioConfigurationForm';
import { TwilioTestResults } from './twilio/TwilioTestResults';
import { TwilioConfigurationHelp } from './twilio/TwilioConfigurationHelp';
import { useTwilioSettings } from './twilio/useTwilioSettings';

export const TwilioSettings: React.FC = () => {
  const [showApiKeys, setShowApiKeys] = useState(false);
  
  const {
    settings,
    setSettings,
    isLoading,
    isTesting,
    isSaving,
    connectionStatus,
    testResult,
    saveSettings,
    testConnection,
    sendTestSMS
  } = useTwilioSettings();

  if (isLoading && !settings.accountSid) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-8 h-8" />
            Twilio SMS Configuration
          </h1>
          <p className="text-gray-600">Configure Twilio SMS service for communication campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          <TwilioStatusBadge status={connectionStatus} />
        </div>
      </div>

      <TwilioConfigurationForm
        settings={settings}
        setSettings={setSettings}
        isSaving={isSaving}
        isTesting={isTesting}
        connectionStatus={connectionStatus}
        showApiKeys={showApiKeys}
        setShowApiKeys={setShowApiKeys}
        onSave={saveSettings}
        onTestConnection={testConnection}
        onSendTestSMS={sendTestSMS}
      />

      <TwilioTestResults testResult={testResult} />

      <TwilioConfigurationHelp />
    </div>
  );
};
