
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettingsData {
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
  systemTimezone: string;
  enableMaintenanceMode: boolean;
  maintenanceMessage: string;
  enableLogging: boolean;
  logLevel: string;
  maxFileUploadSize: number;
  sessionTimeout: number;
  enableBackups: boolean;
  backupFrequency: string;
}

const DEFAULT_SETTINGS: SystemSettingsData = {
  organizationName: 'Electoral Commission',
  contactEmail: 'admin@electoral.gov.jm',
  contactPhone: '+1-876-XXX-XXXX',
  systemTimezone: 'America/Jamaica',
  enableMaintenanceMode: false,
  maintenanceMessage: 'System is currently under maintenance. Please check back later.',
  enableLogging: true,
  logLevel: 'info',
  maxFileUploadSize: 10,
  sessionTimeout: 60,
  enableBackups: true,
  backupFrequency: 'daily'
};

export const useSystemSettings = () => {
  const [formData, setFormData] = useState<SystemSettingsData>(DEFAULT_SETTINGS);
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
          organizationName: config.SYSTEM_ORGANIZATION_NAME || DEFAULT_SETTINGS.organizationName,
          contactEmail: config.SYSTEM_CONTACT_EMAIL || DEFAULT_SETTINGS.contactEmail,
          contactPhone: config.SYSTEM_CONTACT_PHONE || DEFAULT_SETTINGS.contactPhone,
          systemTimezone: config.SYSTEM_TIMEZONE || DEFAULT_SETTINGS.systemTimezone,
          enableMaintenanceMode: config.SYSTEM_ENABLE_MAINTENANCE_MODE || DEFAULT_SETTINGS.enableMaintenanceMode,
          maintenanceMessage: config.SYSTEM_MAINTENANCE_MESSAGE || DEFAULT_SETTINGS.maintenanceMessage,
          enableLogging: config.SYSTEM_ENABLE_LOGGING !== false,
          logLevel: config.SYSTEM_LOG_LEVEL || DEFAULT_SETTINGS.logLevel,
          maxFileUploadSize: config.SYSTEM_MAX_FILE_UPLOAD_SIZE || DEFAULT_SETTINGS.maxFileUploadSize,
          sessionTimeout: config.SYSTEM_SESSION_TIMEOUT || DEFAULT_SETTINGS.sessionTimeout,
          enableBackups: config.SYSTEM_ENABLE_BACKUPS !== false,
          backupFrequency: config.SYSTEM_BACKUP_FREQUENCY || DEFAULT_SETTINGS.backupFrequency
        });
      }

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
          setting_key: 'SYSTEM_ORGANIZATION_NAME',
          setting_value: { value: formData.organizationName },
          description: 'Organization name',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_CONTACT_EMAIL',
          setting_value: { value: formData.contactEmail },
          description: 'System contact email',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_CONTACT_PHONE',
          setting_value: { value: formData.contactPhone },
          description: 'System contact phone',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_TIMEZONE',
          setting_value: { value: formData.systemTimezone },
          description: 'System timezone',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_ENABLE_MAINTENANCE_MODE',
          setting_value: { value: formData.enableMaintenanceMode },
          description: 'Maintenance mode enabled',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_MAINTENANCE_MESSAGE',
          setting_value: { value: formData.maintenanceMessage },
          description: 'Maintenance mode message',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_ENABLE_LOGGING',
          setting_value: { value: formData.enableLogging },
          description: 'System logging enabled',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_LOG_LEVEL',
          setting_value: { value: formData.logLevel },
          description: 'System log level',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_MAX_FILE_UPLOAD_SIZE',
          setting_value: { value: formData.maxFileUploadSize },
          description: 'Maximum file upload size in MB',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_SESSION_TIMEOUT',
          setting_value: { value: formData.sessionTimeout },
          description: 'Session timeout in minutes',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_ENABLE_BACKUPS',
          setting_value: { value: formData.enableBackups },
          description: 'System backups enabled',
          is_active: true
        },
        {
          setting_key: 'SYSTEM_BACKUP_FREQUENCY',
          setting_value: { value: formData.backupFrequency },
          description: 'Backup frequency',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save system settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully"
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
