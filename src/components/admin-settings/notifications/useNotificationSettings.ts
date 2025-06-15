
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  adminEmail: string;
  fromEmail: string;
  notifyOnRegistration: boolean;
  notifyOnReports: boolean;
  smsNotificationsEnabled: boolean;
  adminPhone: string;
  emergencyAlertsEnabled: boolean;
  welcomeEmailTemplate: string;
  reportNotificationTemplate: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  emailNotificationsEnabled: true,
  adminEmail: '',
  fromEmail: '',
  notifyOnRegistration: true,
  notifyOnReports: true,
  smsNotificationsEnabled: false,
  adminPhone: '',
  emergencyAlertsEnabled: false,
  welcomeEmailTemplate: 'Welcome to the Electoral Observation System! Your account has been created successfully.',
  reportNotificationTemplate: 'A new observation report has been submitted and requires your attention.'
};

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .like('setting_key', 'NOTIFICATION_%');

      if (error) {
        console.error('Error loading notification settings:', error);
        toast({
          title: "Error",
          description: "Failed to load notification settings",
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
          emailNotificationsEnabled: config.NOTIFICATION_EMAIL_ENABLED !== false,
          adminEmail: config.NOTIFICATION_ADMIN_EMAIL || DEFAULT_SETTINGS.adminEmail,
          fromEmail: config.NOTIFICATION_FROM_EMAIL || DEFAULT_SETTINGS.fromEmail,
          notifyOnRegistration: config.NOTIFICATION_ON_REGISTRATION !== false,
          notifyOnReports: config.NOTIFICATION_ON_REPORTS !== false,
          smsNotificationsEnabled: config.NOTIFICATION_SMS_ENABLED || DEFAULT_SETTINGS.smsNotificationsEnabled,
          adminPhone: config.NOTIFICATION_ADMIN_PHONE || DEFAULT_SETTINGS.adminPhone,
          emergencyAlertsEnabled: config.NOTIFICATION_EMERGENCY_ALERTS || DEFAULT_SETTINGS.emergencyAlertsEnabled,
          welcomeEmailTemplate: config.NOTIFICATION_WELCOME_TEMPLATE || DEFAULT_SETTINGS.welcomeEmailTemplate,
          reportNotificationTemplate: config.NOTIFICATION_REPORT_TEMPLATE || DEFAULT_SETTINGS.reportNotificationTemplate
        });
      }

    } catch (error: any) {
      console.error('Error loading notification settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load notification settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
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
          setting_key: 'NOTIFICATION_EMAIL_ENABLED',
          setting_value: { value: settings.emailNotificationsEnabled },
          description: 'Email notifications enabled status',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_ADMIN_EMAIL',
          setting_value: { value: settings.adminEmail },
          description: 'Admin email address for notifications',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_FROM_EMAIL',
          setting_value: { value: settings.fromEmail },
          description: 'From email address for notifications',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_ON_REGISTRATION',
          setting_value: { value: settings.notifyOnRegistration },
          description: 'Notify on observer registration',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_ON_REPORTS',
          setting_value: { value: settings.notifyOnReports },
          description: 'Notify on report submission',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_SMS_ENABLED',
          setting_value: { value: settings.smsNotificationsEnabled },
          description: 'SMS notifications enabled status',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_ADMIN_PHONE',
          setting_value: { value: settings.adminPhone },
          description: 'Admin phone number for SMS notifications',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_EMERGENCY_ALERTS',
          setting_value: { value: settings.emergencyAlertsEnabled },
          description: 'Emergency SMS alerts enabled status',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_WELCOME_TEMPLATE',
          setting_value: { value: settings.welcomeEmailTemplate },
          description: 'Welcome email template',
          is_active: true
        },
        {
          setting_key: 'NOTIFICATION_REPORT_TEMPLATE',
          setting_value: { value: settings.reportNotificationTemplate },
          description: 'Report notification email template',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save notification settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "Notification settings have been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save notification settings",
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
