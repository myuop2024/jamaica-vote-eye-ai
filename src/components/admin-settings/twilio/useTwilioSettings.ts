
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TwilioSettings, TestResult, ConnectionStatus } from './types';
import { loadTwilioSettings, saveTwilioSettings } from './twilioConfigOperations';
import { testTwilioConnection, sendTestSMS } from './twilioTestOperations';
import { createToastMessage } from './twilioNotifications';

export const useTwilioSettings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  
  const [settings, setSettings] = useState<TwilioSettings>({
    accountSid: '',
    authToken: '',
    fromNumber: '',
    enabled: true,
    webhookUrl: '',
    statusCallbackUrl: ''
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const loadedSettings = await loadTwilioSettings();
      setSettings(prev => ({ ...prev, ...loadedSettings }));

      if (loadedSettings.accountSid && loadedSettings.authToken) {
        setConnectionStatus('unknown');
      }
      
      toast(createToastMessage.settingsLoaded());
    } catch (error: any) {
      console.error('Error loading Twilio settings:', error);
      toast(createToastMessage.loadError(error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      await saveTwilioSettings(settings);
      toast(createToastMessage.settingsSaved());
      setConnectionStatus('unknown');
      
    } catch (error: any) {
      console.error('Error saving Twilio settings:', error);
      if (error.message.includes('required')) {
        toast(createToastMessage.validationError());
      } else {
        toast(createToastMessage.saveError(error.message));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      const result = await testTwilioConnection(settings.accountSid, settings.authToken, settings.fromNumber);
      setTestResult(result);

      if (result.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }

    } catch (error: any) {
      console.error('Error testing Twilio connection:', error);
      setConnectionStatus('error');
      setTestResult({
        success: false,
        message: error.message || "Failed to test connection"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendTestSMS = async () => {
    try {
      setIsTesting(true);
      
      if (!settings.fromNumber) {
        toast(createToastMessage.fromNumberRequired());
        return;
      }

      if (connectionStatus !== 'connected') {
        toast(createToastMessage.testConnectionFirst());
        return;
      }

      const testNumber = prompt('Enter a test phone number (with country code, e.g., +1234567890):');
      if (!testNumber) return;
      
      await sendTestSMS(settings.fromNumber, testNumber);
      toast(createToastMessage.testSMSSent(testNumber));

    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast(createToastMessage.testSMSError(error.message));
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    setSettings,
    isLoading,
    isTesting,
    isSaving,
    connectionStatus,
    testResult,
    saveSettings,
    testConnection,
    sendTestSMS: handleSendTestSMS
  };
};
