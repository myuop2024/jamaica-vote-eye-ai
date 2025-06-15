
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

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

interface SystemSettingsFormProps {
  formData: SystemSettingsData;
  isLoading: boolean;
  onFormDataChange: (data: SystemSettingsData) => void;
  onSave: () => void;
}

export const SystemSettingsForm: React.FC<SystemSettingsFormProps> = ({
  formData,
  isLoading,
  onFormDataChange,
  onSave
}) => {
  const updateField = (field: keyof SystemSettingsData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Organization Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Organization Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            value={formData.organizationName}
            onChange={(e) => updateField('organizationName', e.target.value)}
            placeholder="Enter organization name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="contact-email">Contact Email</Label>
            <Input
              id="contact-email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => updateField('contactEmail', e.target.value)}
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-phone">Contact Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) => updateField('contactPhone', e.target.value)}
              placeholder="+1-876-XXX-XXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">System Timezone</Label>
          <Select
            value={formData.systemTimezone}
            onValueChange={(value) => updateField('systemTimezone', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Jamaica">America/Jamaica (UTC-5)</SelectItem>
              <SelectItem value="America/New_York">America/New_York (UTC-5/-4)</SelectItem>
              <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Maintenance Mode</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Maintenance Mode</Label>
            <p className="text-sm text-gray-500">
              Temporarily disable system access for maintenance
            </p>
          </div>
          <Switch
            checked={formData.enableMaintenanceMode}
            onCheckedChange={(checked) => updateField('enableMaintenanceMode', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea
            id="maintenance-message"
            value={formData.maintenanceMessage}
            onChange={(e) => updateField('maintenanceMessage', e.target.value)}
            placeholder="Enter message to display during maintenance"
            rows={3}
          />
        </div>
      </div>

      {/* System Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">System Configuration</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable System Logging</Label>
            <p className="text-sm text-gray-500">
              Log system events and errors for debugging
            </p>
          </div>
          <Switch
            checked={formData.enableLogging}
            onCheckedChange={(checked) => updateField('enableLogging', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="log-level">Log Level</Label>
          <Select
            value={formData.logLevel}
            onValueChange={(value) => updateField('logLevel', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select log level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max-upload">Max File Upload Size (MB)</Label>
            <Input
              id="max-upload"
              type="number"
              value={formData.maxFileUploadSize}
              onChange={(e) => updateField('maxFileUploadSize', parseInt(e.target.value) || 10)}
              placeholder="10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={formData.sessionTimeout}
              onChange={(e) => updateField('sessionTimeout', parseInt(e.target.value) || 60)}
              placeholder="60"
            />
          </div>
        </div>
      </div>

      {/* Backup Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Backup Configuration</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Automatic Backups</Label>
            <p className="text-sm text-gray-500">
              Automatically backup system data
            </p>
          </div>
          <Switch
            checked={formData.enableBackups}
            onCheckedChange={(checked) => updateField('enableBackups', checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="backup-frequency">Backup Frequency</Label>
          <Select
            value={formData.backupFrequency}
            onValueChange={(value) => updateField('backupFrequency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select backup frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={onSave}
          disabled={isLoading}
          className="w-full md:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};
