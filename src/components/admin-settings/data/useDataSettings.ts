
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DataSettings {
  enableAutoBackup: boolean;
  backupFrequency: string;
  backupRetentionDays: number;
  backupTime: string;
  logRetentionDays: number;
  reportRetentionDays: number;
  userRetentionDays: number;
  enableAutoCleanup: boolean;
  defaultExportFormat: string;
  includeMetadata: boolean;
  anonymizeData: boolean;
}

const DEFAULT_SETTINGS: DataSettings = {
  enableAutoBackup: true,
  backupFrequency: 'daily',
  backupRetentionDays: 30,
  backupTime: '02:00',
  logRetentionDays: 90,
  reportRetentionDays: 365,
  userRetentionDays: 730,
  enableAutoCleanup: false,
  defaultExportFormat: 'csv',
  includeMetadata: true,
  anonymizeData: false
};

export const useDataSettings = () => {
  const [settings, setSettings] = useState<DataSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .like('setting_key', 'DATA_%');

      if (error) {
        console.error('Error loading data settings:', error);
        toast({
          title: "Error",
          description: "Failed to load data settings",
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
          enableAutoBackup: config.DATA_ENABLE_AUTO_BACKUP !== false,
          backupFrequency: config.DATA_BACKUP_FREQUENCY || DEFAULT_SETTINGS.backupFrequency,
          backupRetentionDays: config.DATA_BACKUP_RETENTION_DAYS || DEFAULT_SETTINGS.backupRetentionDays,
          backupTime: config.DATA_BACKUP_TIME || DEFAULT_SETTINGS.backupTime,
          logRetentionDays: config.DATA_LOG_RETENTION_DAYS || DEFAULT_SETTINGS.logRetentionDays,
          reportRetentionDays: config.DATA_REPORT_RETENTION_DAYS || DEFAULT_SETTINGS.reportRetentionDays,
          userRetentionDays: config.DATA_USER_RETENTION_DAYS || DEFAULT_SETTINGS.userRetentionDays,
          enableAutoCleanup: config.DATA_ENABLE_AUTO_CLEANUP || DEFAULT_SETTINGS.enableAutoCleanup,
          defaultExportFormat: config.DATA_DEFAULT_EXPORT_FORMAT || DEFAULT_SETTINGS.defaultExportFormat,
          includeMetadata: config.DATA_INCLUDE_METADATA !== false,
          anonymizeData: config.DATA_ANONYMIZE_DATA || DEFAULT_SETTINGS.anonymizeData
        });
      }

    } catch (error: any) {
      console.error('Error loading data settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load data settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof DataSettings, value: any) => {
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
          setting_key: 'DATA_ENABLE_AUTO_BACKUP',
          setting_value: { value: settings.enableAutoBackup },
          description: 'Enable automatic data backups',
          is_active: true
        },
        {
          setting_key: 'DATA_BACKUP_FREQUENCY',
          setting_value: { value: settings.backupFrequency },
          description: 'Backup frequency schedule',
          is_active: true
        },
        {
          setting_key: 'DATA_BACKUP_RETENTION_DAYS',
          setting_value: { value: settings.backupRetentionDays },
          description: 'Backup retention period in days',
          is_active: true
        },
        {
          setting_key: 'DATA_BACKUP_TIME',
          setting_value: { value: settings.backupTime },
          description: 'Daily backup time',
          is_active: true
        },
        {
          setting_key: 'DATA_LOG_RETENTION_DAYS',
          setting_value: { value: settings.logRetentionDays },
          description: 'System logs retention period in days',
          is_active: true
        },
        {
          setting_key: 'DATA_REPORT_RETENTION_DAYS',
          setting_value: { value: settings.reportRetentionDays },
          description: 'Reports retention period in days',
          is_active: true
        },
        {
          setting_key: 'DATA_USER_RETENTION_DAYS',
          setting_value: { value: settings.userRetentionDays },
          description: 'Inactive user data retention period in days',
          is_active: true
        },
        {
          setting_key: 'DATA_ENABLE_AUTO_CLEANUP',
          setting_value: { value: settings.enableAutoCleanup },
          description: 'Enable automatic data cleanup',
          is_active: true
        },
        {
          setting_key: 'DATA_DEFAULT_EXPORT_FORMAT',
          setting_value: { value: settings.defaultExportFormat },
          description: 'Default data export format',
          is_active: true
        },
        {
          setting_key: 'DATA_INCLUDE_METADATA',
          setting_value: { value: settings.includeMetadata },
          description: 'Include metadata in data exports',
          is_active: true
        },
        {
          setting_key: 'DATA_ANONYMIZE_DATA',
          setting_value: { value: settings.anonymizeData },
          description: 'Anonymize personal data in exports',
          is_active: true
        }
      ];

      const { error } = await supabase
        .from('didit_configuration')
        .upsert(settingsToSave, {
          onConflict: 'setting_key'
        });

      if (error) {
        throw new Error(`Failed to save data settings: ${error.message}`);
      }

      toast({
        title: "Settings Saved",
        description: "Data management settings have been updated successfully"
      });

    } catch (error: any) {
      console.error('Error saving data settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save data settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      toast({
        title: "Export Started",
        description: "Data export is being prepared. This may take a few minutes."
      });
      
      // TODO: Implement data export functionality
      console.log('Starting data export with format:', settings.defaultExportFormat);
      
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const cleanupOldData = async () => {
    try {
      toast({
        title: "Cleanup Started",
        description: "Old data cleanup is being processed. This may take a few minutes."
      });
      
      // TODO: Implement data cleanup functionality
      console.log('Starting data cleanup with retention policies:', {
        logs: settings.logRetentionDays,
        reports: settings.reportRetentionDays,
        users: settings.userRetentionDays
      });
      
    } catch (error: any) {
      console.error('Error cleaning up data:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to cleanup old data",
        variant: "destructive"
      });
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
    loadSettings,
    exportData,
    cleanupOldData
  };
};
