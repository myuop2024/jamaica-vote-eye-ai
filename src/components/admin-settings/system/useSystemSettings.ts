
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SystemFormData, SystemSettingsData } from './types';

const DEFAULT_SETTINGS: SystemFormData = {
  systemName: 'Electoral Observation System',
  systemVersion: '1.0.0',
  systemDescription: 'Comprehensive electoral observation and monitoring system',
  maintenanceMode: false,
  autoBackup: true,
  backupRetentionDays: 30,
  apiRateLimit: 100,
  sessionTimeout: 60,
  enableApiLogging: true
};

export const useSystemSettings = () => {
  const [formData, setFormData] = useState<SystemFormData>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .like('setting_key', 'SYSTEM_%');

      if (error) {
        console.error('Error loading system settings:', error);
        toast({
          title: "Error",
          description: "Failed to load system settings",
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

        setFormData({
          systemName: config.SYSTEM_NAME || DEFAULT_SETTINGS.systemName,
          systemVersion: config.SYSTEM_VERSION || DEFAULT_SETTINGS.systemVersion,
          systemDescription: config.SYSTEM_DESCRIPTION || DEFAULT_SETTINGS.systemDescription,
          maintenanceMode: config.SYSTEM_MAINTENANCE_MODE || DEFAULT_SETTINGS.maintenanceMode,
          autoBackup: config.SYSTEM_AUTO_BACKUP !== false,
          backupRetentionDays: config.SYSTEM_BACKUP_RETENTION_DAYS || DEFAULT_SETTINGS.backupRetentionDays,
          apiRateLimit: config.SYSTEM_API_RATE_LIMIT || DEFAULT_SETTINGS.apiRateLimit,
          sessionTimeout: config.SYSTEM_SESSION_TIMEOUT || DEFAULT_SETTINGS.sessionTimeout,
          enableApiLogging: config.SYSTEM_ENABLE_API_LOGGING !== false
        });
      }

      toast({
        title: "Settings Loaded",
        description: "System configuration loaded successfully"
      });

    } catch (error: any) {
      console.error('Error loading system settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load system settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      const settingsToSave = [
        {
          setting_key: 'SYSTEM_NAME',
          setting_value: { value: formData.systemName },
          description: 'System name',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_VERSION',
          setting_value: { value: formData.systemVersion },
          description: 'System version',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_DESCRIPTION',
          setting_value: { value: formData.systemDescription },
          description: 'System description',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_MAINTENANCE_MODE',
          setting_value: { value: formData.maintenanceMode },
          description: 'System maintenance mode status',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_AUTO_BACKUP',
          setting_value: { value: formData.autoBackup },
          description: 'Auto backup enabled status',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_BACKUP_RETENTION_DAYS',
          setting_value: { value: formData.backupRetentionDays },
          description: 'Backup retention period in days',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_API_RATE_LIMIT',
          setting_value: { value: formData.apiRateLimit },
          description: 'API rate limit per minute',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_SESSION_TIMEOUT',
          setting_value: { value: formData.sessionTimeout },
          description: 'Session timeout in minutes',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_ENABLE_API_LOGGING',
          setting_value: { value: formData.enableApiLogging },
          description: 'API logging enabled status',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "System configuration has been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving system settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save system settings",
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
    formData,
    setFormData,
    isLoading,
    isSaving,
    saveSettings,
    loadSettings
  };
};
