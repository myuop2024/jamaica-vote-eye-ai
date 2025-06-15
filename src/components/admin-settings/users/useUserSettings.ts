
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserSettings {
  allowPublicRegistration: boolean;
  requirePhoneVerification: boolean;
  defaultUserRole: string;
  welcomeMessage: string;
  enableProfileImages: boolean;
  publicProfilesDefault: boolean;
  maxProfileImageSize: number;
  defaultEmailNotifications: boolean;
  defaultSmsNotifications: boolean;
  defaultReportReminders: boolean;
  accountInactivityDays: number;
  autoDeactivateInactive: boolean;
  allowAccountDeletion: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  allowPublicRegistration: true,
  requirePhoneVerification: false,
  defaultUserRole: 'observer',
  welcomeMessage: 'Welcome to the Electoral Observation System! Your account has been created successfully.',
  enableProfileImages: true,
  publicProfilesDefault: false,
  maxProfileImageSize: 5,
  defaultEmailNotifications: true,
  defaultSmsNotifications: false,
  defaultReportReminders: true,
  accountInactivityDays: 365,
  autoDeactivateInactive: false,
  allowAccountDeletion: true
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .like('setting_key', 'USER_%');

      if (error) {
        console.error('Error loading user settings:', error);
        toast({
          title: "Error",
          description: "Failed to load user settings",
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
          allowPublicRegistration: config.USER_ALLOW_PUBLIC_REGISTRATION !== false,
          requirePhoneVerification: config.USER_REQUIRE_PHONE_VERIFICATION || DEFAULT_SETTINGS.requirePhoneVerification,
          defaultUserRole: config.USER_DEFAULT_ROLE || DEFAULT_SETTINGS.defaultUserRole,
          welcomeMessage: config.USER_WELCOME_MESSAGE || DEFAULT_SETTINGS.welcomeMessage,
          enableProfileImages: config.USER_ENABLE_PROFILE_IMAGES !== false,
          publicProfilesDefault: config.USER_PUBLIC_PROFILES_DEFAULT || DEFAULT_SETTINGS.publicProfilesDefault,
          maxProfileImageSize: config.USER_MAX_PROFILE_IMAGE_SIZE || DEFAULT_SETTINGS.maxProfileImageSize,
          defaultEmailNotifications: config.USER_DEFAULT_EMAIL_NOTIFICATIONS !== false,
          defaultSmsNotifications: config.USER_DEFAULT_SMS_NOTIFICATIONS || DEFAULT_SETTINGS.defaultSmsNotifications,
          defaultReportReminders: config.USER_DEFAULT_REPORT_REMINDERS !== false,
          accountInactivityDays: config.USER_ACCOUNT_INACTIVITY_DAYS || DEFAULT_SETTINGS.accountInactivityDays,
          autoDeactivateInactive: config.USER_AUTO_DEACTIVATE_INACTIVE || DEFAULT_SETTINGS.autoDeactivateInactive,
          allowAccountDeletion: config.USER_ALLOW_ACCOUNT_DELETION !== false
        });
      }

    } catch (error: any) {
      console.error('Error loading user settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load user settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof UserSettings, value: any) => {
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
          setting_key: 'USER_ALLOW_PUBLIC_REGISTRATION',
          setting_value: { value: settings.allowPublicRegistration },
          description: 'Allow public user registration',
          is_active: true
        },
        {
          setting_key: 'USER_REQUIRE_PHONE_VERIFICATION',
          setting_value: { value: settings.requirePhoneVerification },
          description: 'Require phone verification during registration',
          is_active: true
        },
        {
          setting_key: 'USER_DEFAULT_ROLE',
          setting_value: { value: settings.defaultUserRole },
          description: 'Default role for new users',
          is_active: true
        },
        {
          setting_key: 'USER_WELCOME_MESSAGE',
          setting_value: { value: settings.welcomeMessage },
          description: 'Welcome message for new users',
          is_active: true
        },
        {
          setting_key: 'USER_ENABLE_PROFILE_IMAGES',
          setting_value: { value: settings.enableProfileImages },
          description: 'Enable profile image uploads',
          is_active: true
        },
        {
          setting_key: 'USER_PUBLIC_PROFILES_DEFAULT',
          setting_value: { value: settings.publicProfilesDefault },
          description: 'Make user profiles public by default',
          is_active: true
        },
        {
          setting_key: 'USER_MAX_PROFILE_IMAGE_SIZE',
          setting_value: { value: settings.maxProfileImageSize },
          description: 'Maximum profile image size in MB',
          is_active: true
        },
        {
          setting_key: 'USER_DEFAULT_EMAIL_NOTIFICATIONS',
          setting_value: { value: settings.defaultEmailNotifications },
          description: 'Enable email notifications by default',
          is_active: true
        },
        {
          setting_key: 'USER_DEFAULT_SMS_NOTIFICATIONS',
          setting_value: { value: settings.defaultSmsNotifications },
          description: 'Enable SMS notifications by default',
          is_active: true
        },
        {
          setting_key: 'USER_DEFAULT_REPORT_REMINDERS',
          setting_value: { value: settings.defaultReportReminders },
          description: 'Enable report reminders by default',
          is_active: true
        },
        {
          setting_key: 'USER_ACCOUNT_INACTIVITY_DAYS',
          setting_value: { value: settings.accountInactivityDays },
          description: 'Account inactivity period in days',
          is_active: true
        },
        {
          setting_key: 'USER_AUTO_DEACTIVATE_INACTIVE',
          setting_value: { value: settings.autoDeactivateInactive },
          description: 'Auto-deactivate inactive accounts',
          is_active: true
        },
        {
          setting_key: 'USER_ALLOW_ACCOUNT_DELETION',
          setting_value: { value: settings.allowAccountDeletion },
          description: 'Allow users to delete their accounts',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save user settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "User settings have been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving user settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user settings",
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
