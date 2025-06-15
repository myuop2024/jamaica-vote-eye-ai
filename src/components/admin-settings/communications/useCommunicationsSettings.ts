
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CommunicationsSettings {
  emailEnabled: boolean;
  emailProvider: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpTls: boolean;
  registrationEmailTemplate: string;
  passwordResetEmailTemplate: string;
  welcomeSmsTemplate: string;
  verificationSmsTemplate: string;
  emailRateLimit: number;
  smsRateLimit: number;
  dailyEmailLimit: number;
  dailySmsLimit: number;
  enableAntiSpam: boolean;
}

const DEFAULT_SETTINGS: CommunicationsSettings = {
  emailEnabled: true,
  emailProvider: 'smtp',
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  smtpTls: true,
  registrationEmailTemplate: 'Welcome to the Electoral Observation System! Please verify your email address by clicking the link below.',
  passwordResetEmailTemplate: 'Click the link below to reset your password. This link will expire in 24 hours.',
  welcomeSmsTemplate: 'Welcome to the Electoral Observation System! Your account has been created successfully.',
  verificationSmsTemplate: 'Your verification code is: {code}. Please enter this code to verify your phone number.',
  emailRateLimit: 100,
  smsRateLimit: 50,
  dailyEmailLimit: 1000,
  dailySmsLimit: 500,
  enableAntiSpam: true
};

export const useCommunicationsSettings = () => {
  const [settings, setSettings] = useState<CommunicationsSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .like('setting_key', 'COMM_%');

      if (error) {
        console.error('Error loading communications settings:', error);
        toast({
          title: "Error",
          description: "Failed to load communications settings",
          variant: "destructive"
        });
        return;
      }

      if (configData && configData.length > 0) {
        const config = configData.reduce((acc, item) => {
          let value: any;
          if (typeof item.setting_value === 'object' && item.setting_value !== null && 'value' in item.setting_value) {
            value = (item.setting_value as any).value;
          } else {
            value = item.setting_value;
          }
          acc[item.setting_key] = value;
          return acc;
        }, {} as Record<string, any>);

        setSettings({
          emailEnabled: config.COMM_EMAIL_ENABLED !== false,
          emailProvider: config.COMM_EMAIL_PROVIDER || DEFAULT_SETTINGS.emailProvider,
          smtpHost: config.COMM_SMTP_HOST || DEFAULT_SETTINGS.smtpHost,
          smtpPort: config.COMM_SMTP_PORT || DEFAULT_SETTINGS.smtpPort,
          smtpUsername: config.COMM_SMTP_USERNAME || DEFAULT_SETTINGS.smtpUsername,
          smtpPassword: config.COMM_SMTP_PASSWORD || DEFAULT_SETTINGS.smtpPassword,
          smtpTls: config.COMM_SMTP_TLS !== false,
          registrationEmailTemplate: config.COMM_REGISTRATION_EMAIL_TEMPLATE || DEFAULT_SETTINGS.registrationEmailTemplate,
          passwordResetEmailTemplate: config.COMM_PASSWORD_RESET_EMAIL_TEMPLATE || DEFAULT_SETTINGS.passwordResetEmailTemplate,
          welcomeSmsTemplate: config.COMM_WELCOME_SMS_TEMPLATE || DEFAULT_SETTINGS.welcomeSmsTemplate,
          verificationSmsTemplate: config.COMM_VERIFICATION_SMS_TEMPLATE || DEFAULT_SETTINGS.verificationSmsTemplate,
          emailRateLimit: config.COMM_EMAIL_RATE_LIMIT || DEFAULT_SETTINGS.emailRateLimit,
          smsRateLimit: config.COMM_SMS_RATE_LIMIT || DEFAULT_SETTINGS.smsRateLimit,
          dailyEmailLimit: config.COMM_DAILY_EMAIL_LIMIT || DEFAULT_SETTINGS.dailyEmailLimit,
          dailySmsLimit: config.COMM_DAILY_SMS_LIMIT || DEFAULT_SETTINGS.dailySmsLimit,
          enableAntiSpam: config.COMM_ENABLE_ANTI_SPAM !== false
        });
      }

    } catch (error: any) {
      console.error('Error loading communications settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load communications settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof CommunicationsSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      const settingsToSave = [
        {
          setting_key: 'COMM_EMAIL_ENABLED',
          setting_value: { value: settings.emailEnabled },
          description: 'Enable email communications',
          is_active: true
        },
        {
          setting_key: 'COMM_EMAIL_PROVIDER',
          setting_value: { value: settings.emailProvider },
          description: 'Email provider type',
          is_active: true
        },
        {
          setting_key: 'COMM_SMTP_HOST',
          setting_value: { value: settings.smtpHost },
          description: 'SMTP server host',
          is_active: true
        },
        {
          setting_key: 'COMM_SMTP_PORT',
          setting_value: { value: settings.smtpPort },
          description: 'SMTP server port',
          is_active: true
        },
        {
          setting_key: 'COMM_SMTP_USERNAME',
          setting_value: { value: settings.smtpUsername },
          description: 'SMTP username',
          is_active: true
        },
        {
          setting_key: 'COMM_SMTP_PASSWORD',
          setting_value: { value: settings.smtpPassword },
          description: 'SMTP password',
          is_active: true
        },
        {
          setting_key: 'COMM_SMTP_TLS',
          setting_value: { value: settings.smtpTls },
          description: 'SMTP TLS encryption',
          is_active: true
        },
        {
          setting_key: 'COMM_REGISTRATION_EMAIL_TEMPLATE',
          setting_value: { value: settings.registrationEmailTemplate },
          description: 'Registration email template',
          is_active: true
        },
        {
          setting_key: 'COMM_PASSWORD_RESET_EMAIL_TEMPLATE',
          setting_value: { value: settings.passwordResetEmailTemplate },
          description: 'Password reset email template',
          is_active: true
        },
        {
          setting_key: 'COMM_WELCOME_SMS_TEMPLATE',
          setting_value: { value: settings.welcomeSmsTemplate },
          description: 'Welcome SMS template',
          is_active: true
        },
        {
          setting_key: 'COMM_VERIFICATION_SMS_TEMPLATE',
          setting_value: { value: settings.verificationSmsTemplate },
          description: 'Phone verification SMS template',
          is_active: true
        },
        {
          setting_key: 'COMM_EMAIL_RATE_LIMIT',
          setting_value: { value: settings.emailRateLimit },
          description: 'Email rate limit per hour',
          is_active: true
        },
        {
          setting_key: 'COMM_SMS_RATE_LIMIT',
          setting_value: { value: settings.smsRateLimit },
          description: 'SMS rate limit per hour',
          is_active: true
        },
        {
          setting_key: 'COMM_DAILY_EMAIL_LIMIT',
          setting_value: { value: settings.dailyEmailLimit },
          description: 'Daily email limit',
          is_active: true
        },
        {
          setting_key: 'COMM_DAILY_SMS_LIMIT',
          setting_value: { value: settings.dailySmsLimit },
          description: 'Daily SMS limit',
          is_active: true
        },
        {
          setting_key: 'COMM_ENABLE_ANTI_SPAM',
          setting_value: { value: settings.enableAntiSpam },
          description: 'Enable anti-spam protection',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save communications settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "Communications settings have been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving communications settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save communications settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings,
    loadSettings
  };
};
