
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TwilioSettings, TestResult, ConnectionStatus } from './types';

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

  const loadTwilioSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .in('setting_key', ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER', 'TWILIO_ENABLED']);

      if (error) {
        console.error('Error loading Twilio settings:', error);
        return;
      }

      if (configData && configData.length > 0) {
        const config = configData.reduce((acc, item) => {
          // Safely extract the value from the Json type
          let value: any;
          if (typeof item.setting_value === 'object' && item.setting_value !== null && 'value' in item.setting_value) {
            value = (item.setting_value as any).value;
          } else {
            value = item.setting_value;
          }
          acc[item.setting_key] = value;
          return acc;
        }, {} as Record<string, any>);

        setSettings(prev => ({
          ...prev,
          accountSid: config.TWILIO_ACCOUNT_SID || '',
          authToken: config.TWILIO_AUTH_TOKEN || '',
          fromNumber: config.TWILIO_FROM_NUMBER || '',
          enabled: config.TWILIO_ENABLED !== false
        }));

        if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
          setConnectionStatus('unknown');
        }
      }
      
      toast({
        title: "Settings Loaded",
        description: "Twilio configuration loaded successfully"
      });
    } catch (error: any) {
      console.error('Error loading Twilio settings:', error);
      toast({
        title: "Error",
        description: "Failed to load Twilio settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      if (!settings.accountSid || !settings.authToken || !settings.fromNumber) {
        toast({
          title: "Validation Error",
          description: "Account SID, Auth Token, and From Number are required",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('save-twilio-settings', {
        body: {
          accountSid: settings.accountSid,
          authToken: settings.authToken,
          fromNumber: settings.fromNumber,
          enabled: settings.enabled
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Settings Saved",
          description: "Twilio configuration has been updated successfully"
        });
        setConnectionStatus('unknown');
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
      
    } catch (error: any) {
      console.error('Error saving Twilio settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save Twilio settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      if (!settings.accountSid || !settings.authToken) {
        setTestResult({
          success: false,
          message: "Account SID and Auth Token are required for testing"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('test-twilio-connection', {
        body: {
          accountSid: settings.accountSid,
          authToken: settings.authToken,
          fromNumber: settings.fromNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus('connected');
        setTestResult({
          success: true,
          message: "Connection successful! Twilio is properly configured.",
          details: data.details
        });
      } else {
        setConnectionStatus('error');
        setTestResult({
          success: false,
          message: data.message || "Connection failed",
          details: data.details
        });
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

  const sendTestSMS = async () => {
    try {
      setIsTesting(true);
      
      if (!settings.fromNumber) {
        toast({
          title: "Error",
          description: "From Number is required to send test SMS",
          variant: "destructive"
        });
        return;
      }

      if (connectionStatus !== 'connected') {
        toast({
          title: "Info",
          description: "Please save your settings and test the connection first",
          variant: "default"
        });
        return;
      }

      const testNumber = prompt('Enter a test phone number (with country code, e.g., +1234567890):');
      if (!testNumber) return;
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: testNumber,
          message: 'Test SMS from Electoral Observation System - Twilio integration working!',
          campaignId: 'test'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Test SMS Sent",
          description: `Test message sent successfully to ${testNumber}`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test SMS');
      }

    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test SMS. Make sure your settings are saved and connection is tested first.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    loadTwilioSettings();
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
    sendTestSMS
  };
};
