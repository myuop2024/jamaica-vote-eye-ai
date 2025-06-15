
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Settings, Save, Database, Globe } from 'lucide-react';
import { SystemFormData } from './types';

interface SystemSettingsFormProps {
  formData: SystemFormData;
  isLoading: boolean;
  onFormDataChange: (data: SystemFormData) => void;
  onSave: () => void;
}

export const SystemSettingsForm: React.FC<SystemSettingsFormProps> = ({
  formData,
  isLoading,
  onFormDataChange,
  onSave
}) => {
  const updateFormData = (field: keyof SystemFormData, value: any) => {
    onFormDataChange({
      ...formData,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure basic system settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="system-name">System Name</Label>
              <Input
                id="system-name"
                value={formData.systemName}
                onChange={(e) => updateFormData('systemName', e.target.value)}
                placeholder="Electoral Observation System"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="system-version">System Version</Label>
              <Input
                id="system-version"
                value={formData.systemVersion}
                onChange={(e) => updateFormData('systemVersion', e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="system-description">System Description</Label>
            <Textarea
              id="system-description"
              value={formData.systemDescription}
              onChange={(e) => updateFormData('systemDescription', e.target.value)}
              placeholder="Description of the electoral observation system"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-gray-500">
                Enable to restrict system access for maintenance
              </p>
            </div>
            <Switch
              checked={formData.maintenanceMode}
              onCheckedChange={(checked) => updateFormData('maintenanceMode', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Configuration
          </CardTitle>
          <CardDescription>
            Configure database connection and backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Backup</Label>
              <p className="text-sm text-gray-500">
                Automatically backup database daily
              </p>
            </div>
            <Switch
              checked={formData.autoBackup}
              onCheckedChange={(checked) => updateFormData('autoBackup', checked)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="backup-retention">Backup Retention (Days)</Label>
            <Input
              id="backup-retention"
              type="number"
              value={formData.backupRetentionDays}
              onChange={(e) => updateFormData('backupRetentionDays', parseInt(e.target.value) || 30)}
              placeholder="30"
            />
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Configure API settings and rate limiting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-rate-limit">API Rate Limit (requests/minute)</Label>
              <Input
                id="api-rate-limit"
                type="number"
                value={formData.apiRateLimit}
                onChange={(e) => updateFormData('apiRateLimit', parseInt(e.target.value) || 100)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={formData.sessionTimeout}
                onChange={(e) => updateFormData('sessionTimeout', parseInt(e.target.value) || 60)}
                placeholder="60"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable API Logging</Label>
              <p className="text-sm text-gray-500">
                Log all API requests for monitoring
              </p>
            </div>
            <Switch
              checked={formData.enableApiLogging}
              onCheckedChange={(checked) => updateFormData('enableApiLogging', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
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
