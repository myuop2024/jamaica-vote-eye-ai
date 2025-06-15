
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Mail, MessageSquare, Save } from 'lucide-react';
import { useNotificationSettings } from './notifications/useNotificationSettings';

export const NotificationSettings: React.FC = () => {
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings
  } = useNotificationSettings();

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
          <Bell className="w-8 h-8" />
          Notification Settings
        </h1>
        <p className="text-gray-600">Configure email and SMS notification preferences</p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Configure email notification settings and templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Send email notifications for system events
              </p>
            </div>
            <Switch
              checked={settings.emailNotificationsEnabled}
              onCheckedChange={(checked) => updateSetting('emailNotificationsEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin Email Address</Label>
            <Input
              id="admin-email"
              type="email"
              value={settings.adminEmail}
              onChange={(e) => updateSetting('adminEmail', e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-from">From Email Address</Label>
            <Input
              id="email-from"
              type="email"
              value={settings.fromEmail}
              onChange={(e) => updateSetting('fromEmail', e.target.value)}
              placeholder="noreply@example.com"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Observer Registration Notifications</Label>
              <p className="text-sm text-gray-500">
                Notify admins when new observers register
              </p>
            </div>
            <Switch
              checked={settings.notifyOnRegistration}
              onCheckedChange={(checked) => updateSetting('notifyOnRegistration', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Report Submission Notifications</Label>
              <p className="text-sm text-gray-500">
                Notify admins when reports are submitted
              </p>
            </div>
            <Switch
              checked={settings.notifyOnReports}
              onCheckedChange={(checked) => updateSetting('notifyOnReports', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* SMS Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Configure SMS notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable SMS Notifications</Label>
              <p className="text-sm text-gray-500">
                Send SMS notifications for urgent events
              </p>
            </div>
            <Switch
              checked={settings.smsNotificationsEnabled}
              onCheckedChange={(checked) => updateSetting('smsNotificationsEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-phone">Admin Phone Number</Label>
            <Input
              id="admin-phone"
              type="tel"
              value={settings.adminPhone}
              onChange={(e) => updateSetting('adminPhone', e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Emergency Alerts</Label>
              <p className="text-sm text-gray-500">
                Send SMS for critical system alerts
              </p>
            </div>
            <Switch
              checked={settings.emergencyAlertsEnabled}
              onCheckedChange={(checked) => updateSetting('emergencyAlertsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize email notification templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcome-template">Welcome Email Template</Label>
            <Textarea
              id="welcome-template"
              value={settings.welcomeEmailTemplate}
              onChange={(e) => updateSetting('welcomeEmailTemplate', e.target.value)}
              placeholder="Welcome to the Electoral Observation System..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-template">Report Notification Template</Label>
            <Textarea
              id="report-template"
              value={settings.reportNotificationTemplate}
              onChange={(e) => updateSetting('reportNotificationTemplate', e.target.value)}
              placeholder="A new observation report has been submitted..."
              rows={4}
            />
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
          {isSaving ? 'Saving...' : 'Save Notification Settings'}
        </Button>
      </div>
    </div>
  );
};
