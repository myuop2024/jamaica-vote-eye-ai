
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  isConfigured: boolean;
}

export interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  secure: boolean;
  isConfigured: boolean;
}

export interface CommunicationsSettings {
  twilio: TwilioConfig;
  smtp: SMTPConfig;
}

export const useCommunicationsSettings = () => {
  const [settings, setSettings] = useState<CommunicationsSettings>({
    twilio: {
      accountSid: '',
      authToken: '',
      phoneNumber: '',
      isConfigured: false,
    },
    smtp: {
      host: '',
      port: 587,
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
      secure: true,
      isConfigured: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState<{
    twilio?: { success: boolean; message: string };
    smtp?: { success: boolean; message: string };
  }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);

      // Load Twilio settings
      const { data: twilioData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'twilio_config')
        .single();

      // Load SMTP settings
      const { data: smtpData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'smtp_config')
        .single();

      if (twilioData?.value && typeof twilioData.value === 'object') {
        setSettings(prev => ({
          ...prev,
          twilio: { ...prev.twilio, ...(twilioData.value as any) }
        }));
      }

      if (smtpData?.value && typeof smtpData.value === 'object') {
        setSettings(prev => ({
          ...prev,
          smtp: { ...prev.smtp, ...(smtpData.value as any) }
        }));
      }
    } catch (error) {
      console.error('Error loading communications settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load communications settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTwilioSettings = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'twilio_config',
          value: settings.twilio as any,
          description: 'Twilio SMS configuration'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Twilio settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving Twilio settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Twilio settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveSMTPSettings = async () => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'smtp_config',
          value: settings.smtp as any,
          description: 'SMTP email configuration'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'SMTP settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SMTP settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testTwilioConnection = async () => {
    try {
      // First save the current settings
      await saveTwilioSettings();

      const response = await fetch('/api/test-twilio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          accountSid: settings.twilio.accountSid,
          authToken: settings.twilio.authToken,
          phoneNumber: settings.twilio.phoneNumber,
        }),
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        twilio: result
      }));

      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing Twilio connection:', error);
      const errorResult = { success: false, message: 'Failed to test connection' };
      setTestResults(prev => ({
        ...prev,
        twilio: errorResult
      }));
      toast({
        title: 'Error',
        description: 'Failed to test Twilio connection',
        variant: 'destructive',
      });
    }
  };

  const testSMTPConnection = async () => {
    try {
      // First save the current settings
      await saveSMTPSettings();

      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(settings.smtp),
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        smtp: result
      }));

      toast({
        title: result.success ? 'Success' : 'Error',
        description: result.message,
        variant: result.success ? 'default' : 'destructive',
      });
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      const errorResult = { success: false, message: 'Failed to test connection' };
      setTestResults(prev => ({
        ...prev,
        smtp: errorResult
      }));
      toast({
        title: 'Error',
        description: 'Failed to test SMTP connection',
        variant: 'destructive',
      });
    }
  };

  const updateTwilioSettings = (updates: Partial<TwilioConfig>) => {
    setSettings(prev => ({
      ...prev,
      twilio: { ...prev.twilio, ...updates }
    }));
  };

  const updateSMTPSettings = (updates: Partial<SMTPConfig>) => {
    setSettings(prev => ({
      ...prev,
      smtp: { ...prev.smtp, ...updates }
    }));
  };

  return {
    settings,
    isLoading,
    isSaving,
    testResults,
    updateTwilioSettings,
    updateSMTPSettings,
    saveTwilioSettings,
    saveSMTPSettings,
    testTwilioConnection,
    testSMTPConnection,
  };
};
