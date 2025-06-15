
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { SystemSettingsForm } from './admin-settings/system/SystemSettingsForm';
import { useSystemSettings } from './admin-settings/system/useSystemSettings';

export const SystemSettings: React.FC = () => {
  const {
    formData,
    setFormData,
    isLoading,
    isSaving,
    saveSettings
  } = useSystemSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SystemSettingsForm
            formData={formData}
            isLoading={isSaving}
            onFormDataChange={setFormData}
            onSave={saveSettings}
          />
        </CardContent>
      </Card>
    </div>
  );
};
