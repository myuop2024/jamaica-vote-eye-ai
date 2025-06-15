
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Download, Upload, Save, Trash2 } from 'lucide-react';
import { useDataSettings } from './data/useDataSettings';

export const DataSettings: React.FC = () => {
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings,
    exportData,
    cleanupOldData
  } = useDataSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-8 h-8" />
          Data Management Settings
        </h1>
        <p className="text-gray-600">Configure data backup, retention, and export settings</p>
      </div>

      {/* Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup Configuration
          </CardTitle>
          <CardDescription>
            Configure automatic backups and data retention policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-gray-500">
                Automatically backup system data at scheduled intervals
              </p>
            </div>
            <Switch
              checked={settings.enableAutoBackup}
              onCheckedChange={(checked) => updateSetting('enableAutoBackup', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-frequency">Backup Frequency</Label>
            <Select
              value={settings.backupFrequency}
              onValueChange={(value) => updateSetting('backupFrequency', value)}
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

          <div className="space-y-2">
            <Label htmlFor="backup-retention">Backup Retention Period (days)</Label>
            <Input
              id="backup-retention"
              type="number"
              value={settings.backupRetentionDays}
              onChange={(e) => updateSetting('backupRetentionDays', parseInt(e.target.value) || 30)}
              placeholder="30"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backup-time">Backup Time (24h format)</Label>
            <Input
              id="backup-time"
              type="time"
              value={settings.backupTime}
              onChange={(e) => updateSetting('backupTime', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            Configure how long different types of data are kept
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="log-retention">System Logs Retention (days)</Label>
            <Input
              id="log-retention"
              type="number"
              value={settings.logRetentionDays}
              onChange={(e) => updateSetting('logRetentionDays', parseInt(e.target.value) || 90)}
              placeholder="90"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-retention">Reports Retention (days)</Label>
            <Input
              id="report-retention"
              type="number"
              value={settings.reportRetentionDays}
              onChange={(e) => updateSetting('reportRetentionDays', parseInt(e.target.value) || 365)}
              placeholder="365"
            />
            <p className="text-sm text-gray-500">Set to 0 to keep reports indefinitely</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-retention">Inactive User Data Retention (days)</Label>
            <Input
              id="user-retention"
              type="number"
              value={settings.userRetentionDays}
              onChange={(e) => updateSetting('userRetentionDays', parseInt(e.target.value) || 730)}
              placeholder="730"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-cleanup Old Data</Label>
              <p className="text-sm text-gray-500">
                Automatically remove old data based on retention policies
              </p>
            </div>
            <Switch
              checked={settings.enableAutoCleanup}
              onCheckedChange={(checked) => updateSetting('enableAutoCleanup', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Configure data export formats and options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Default Export Format</Label>
            <Select
              value={settings.defaultExportFormat}
              onValueChange={(value) => updateSetting('defaultExportFormat', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select export format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include System Metadata</Label>
              <p className="text-sm text-gray-500">
                Include creation dates, IDs, and other metadata in exports
              </p>
            </div>
            <Switch
              checked={settings.includeMetadata}
              onCheckedChange={(checked) => updateSetting('includeMetadata', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Anonymize Personal Data</Label>
              <p className="text-sm text-gray-500">
                Remove or hash personal information in exports
              </p>
            </div>
            <Switch
              checked={settings.anonymizeData}
              onCheckedChange={(checked) => updateSetting('anonymizeData', checked)}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={exportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export All Data
            </Button>
            <Button 
              onClick={cleanupOldData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Cleanup Old Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings}
          disabled={isSaving}
          className="w-full md:w-auto"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Data Settings'}
        </Button>
      </div>
    </div>
  );
};
