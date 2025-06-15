
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SecuritySettings {
  requireEmailVerification: boolean;
  enableTwoFactorAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  passwordExpiryDays: number;
  allowedEmailDomains: string;
  defaultUserRole: string;
  autoApproveObservers: boolean;
}

const DEFAULT_SETTINGS: SecuritySettings = {
  requireEmailVerification: true,
  enableTwoFactorAuth: false,
  sessionTimeout: 60,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordExpiryDays: 90,
  allowedEmailDomains: '',
  defaultUserRole: 'observer',
  autoApproveObservers: false
};

export const useSecuritySettings = () => {
  const [settings, setSettings] = useState<SecuritySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .like('setting_key', 'SECURITY_%');

      if (error) {
        console.error('Error loading security settings:', error);
        toast({
          title: "Error",
          description: "Failed to load security settings",
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
          requireEmailVerification: config.SECURITY_REQUIRE_EMAIL_VERIFICATION !== false,
          enableTwoFactorAuth: config.SECURITY_ENABLE_2FA || DEFAULT_SETTINGS.enableTwoFactorAuth,
          sessionTimeout: config.SECURITY_SESSION_TIMEOUT || DEFAULT_SETTINGS.sessionTimeout,
          maxLoginAttempts: config.SECURITY_MAX_LOGIN_ATTEMPTS || DEFAULT_SETTINGS.maxLoginAttempts,
          lockoutDuration: config.SECURITY_LOCKOUT_DURATION || DEFAULT_SETTINGS.lockoutDuration,
          minPasswordLength: config.SECURITY_MIN_PASSWORD_LENGTH || DEFAULT_SETTINGS.minPasswordLength,
          requireUppercase: config.SECURITY_REQUIRE_UPPERCASE !== false,
          requireNumbers: config.SECURITY_REQUIRE_NUMBERS !== false,
          requireSpecialChars: config.SECURITY_REQUIRE_SPECIAL_CHARS !== false,
          passwordExpiryDays: config.SECURITY_PASSWORD_EXPIRY_DAYS || DEFAULT_SETTINGS.passwordExpiryDays,
          allowedEmailDomains: config.SECURITY_ALLOWED_EMAIL_DOMAINS || DEFAULT_SETTINGS.allowedEmailDomains,
          defaultUserRole: config.SECURITY_DEFAULT_USER_ROLE || DEFAULT_SETTINGS.defaultUserRole,
          autoApproveObservers: config.SECURITY_AUTO_APPROVE_OBSERVERS || DEFAULT_SETTINGS.autoApproveObservers
        });
      }

    } catch (error: any) {
      console.error('Error loading security settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load security settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof SecuritySettings, value: any) => {
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
          setting_key: 'SECURITY_REQUIRE_EMAIL_VERIFICATION',
          setting_value: { value: settings.requireEmailVerification },
          description: 'Require email verification for new users',
          is_active: true
        },
        {
          setting_key: 'SECURITY_ENABLE_2FA',
          setting_value: { value: settings.enableTwoFactorAuth },
          description: 'Enable two-factor authentication',
          is_active: true
        },
        {
          setting_key: 'SECURITY_SESSION_TIMEOUT',
          setting_value: { value: settings.sessionTimeout },
          description: 'Session timeout in minutes',
          is_active: true
        },
        {
          setting_key: 'SECURITY_MAX_LOGIN_ATTEMPTS',
          setting_value: { value: settings.maxLoginAttempts },
          description: 'Maximum login attempts before lockout',
          is_active: true
        },
        {
          setting_key: 'SECURITY_LOCKOUT_DURATION',
          setting_value: { value: settings.lockoutDuration },
          description: 'Account lockout duration in minutes',
          is_active: true
        },
        {
          setting_key: 'SECURITY_MIN_PASSWORD_LENGTH',
          setting_value: { value: settings.minPasswordLength },
          description: 'Minimum password length',
          is_active: true
        },
        {
          setting_key: 'SECURITY_REQUIRE_UPPERCASE',
          setting_value: { value: settings.requireUppercase },
          description: 'Require uppercase letters in passwords',
          is_active: true
        },
        {
          setting_key: 'SECURITY_REQUIRE_NUMBERS',
          setting_value: { value: settings.requireNumbers },
          description: 'Require numbers in passwords',
          is_active: true
        },
        {
          setting_key: 'SECURITY_REQUIRE_SPECIAL_CHARS',
          setting_value: { value: settings.requireSpecialChars },
          description: 'Require special characters in passwords',
          is_active: true
        },
        {
          setting_key: 'SECURITY_PASSWORD_EXPIRY_DAYS',
          setting_value: { value: settings.passwordExpiryDays },
          description: 'Password expiry period in days',
          is_active: true
        },
        {
          setting_key: 'SECURITY_ALLOWED_EMAIL_DOMAINS',
          setting_value: { value: settings.allowedEmailDomains },
          description: 'Allowed email domains for registration',
          is_active: true
        },
        {
          setting_key: 'SECURITY_DEFAULT_USER_ROLE',
          setting_value: { value: settings.defaultUserRole },
          description: 'Default role for new users',
          is_active: true
        },
        {
          setting_key: 'SECURITY_AUTO_APPROVE_OBSERVERS',
          setting_value: { value: settings.autoApproveObservers },
          description: 'Auto-approve new observer registrations',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save security settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "Security settings have been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving security settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save security settings",
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
