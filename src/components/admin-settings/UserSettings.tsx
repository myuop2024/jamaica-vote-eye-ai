import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Users, UserPlus, Settings as SettingsIcon, Save } from 'lucide-react';
import { useUserSettings } from './users/useUserSettings';
import { ProfileFieldTemplateManager } from './ProfileFieldTemplateManager';

export const UserSettings: React.FC = () => {
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings
  } = useUserSettings();

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
          <Users className="w-8 h-8" />
          User Settings
        </h1>
        <p className="text-gray-600">Configure default user preferences and registration settings</p>
      </div>

      {/* Registration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Registration Settings
          </CardTitle>
          <CardDescription>
            Configure user registration and onboarding preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Public Registration</Label>
              <p className="text-sm text-gray-500">
                Allow users to register without admin approval
              </p>
            </div>
            <Switch
              checked={settings.allowPublicRegistration}
              onCheckedChange={(checked) => updateSetting('allowPublicRegistration', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Phone Verification</Label>
              <p className="text-sm text-gray-500">
                Require users to verify their phone number during registration
              </p>
            </div>
            <Switch
              checked={settings.requirePhoneVerification}
              onCheckedChange={(checked) => updateSetting('requirePhoneVerification', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-role">Default User Role</Label>
            <Select
              value={settings.defaultUserRole}
              onValueChange={(value) => updateSetting('defaultUserRole', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="observer">Observer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              value={settings.welcomeMessage}
              onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
              placeholder="Welcome to the Electoral Observation System..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Default Profile Settings
          </CardTitle>
          <CardDescription>
            Configure default settings for new user profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Profile Images</Label>
              <p className="text-sm text-gray-500">
                Allow users to upload profile pictures
              </p>
            </div>
            <Switch
              checked={settings.enableProfileImages}
              onCheckedChange={(checked) => updateSetting('enableProfileImages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Make Profiles Public</Label>
              <p className="text-sm text-gray-500">
                Make user profiles visible to other observers by default
              </p>
            </div>
            <Switch
              checked={settings.publicProfilesDefault}
              onCheckedChange={(checked) => updateSetting('publicProfilesDefault', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-profile-image-size">Max Profile Image Size (MB)</Label>
            <Input
              id="max-profile-image-size"
              type="number"
              value={settings.maxProfileImageSize}
              onChange={(e) => updateSetting('maxProfileImageSize', parseInt(e.target.value) || 5)}
              placeholder="5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Default Notification Preferences</CardTitle>
          <CardDescription>
            Configure default notification settings for new users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">
                Enable email notifications by default for new users
              </p>
            </div>
            <Switch
              checked={settings.defaultEmailNotifications}
              onCheckedChange={(checked) => updateSetting('defaultEmailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-gray-500">
                Enable SMS notifications by default for new users
              </p>
            </div>
            <Switch
              checked={settings.defaultSmsNotifications}
              onCheckedChange={(checked) => updateSetting('defaultSmsNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Report Submission Reminders</Label>
              <p className="text-sm text-gray-500">
                Send reminders to submit reports by default
              </p>
            </div>
            <Switch
              checked={settings.defaultReportReminders}
              onCheckedChange={(checked) => updateSetting('defaultReportReminders', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>
            Configure account management policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-inactivity-days">Account Inactivity Period (days)</Label>
            <Input
              id="account-inactivity-days"
              type="number"
              value={settings.accountInactivityDays}
              onChange={(e) => updateSetting('accountInactivityDays', parseInt(e.target.value) || 365)}
              placeholder="365"
            />
            <p className="text-sm text-gray-500">Mark accounts as inactive after this period</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-deactivate Inactive Accounts</Label>
              <p className="text-sm text-gray-500">
                Automatically deactivate accounts after inactivity period
              </p>
            </div>
            <Switch
              checked={settings.autoDeactivateInactive}
              onCheckedChange={(checked) => updateSetting('autoDeactivateInactive', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Allow Account Deletion</Label>
              <p className="text-sm text-gray-500">
                Allow users to delete their own accounts
              </p>
            </div>
            <Switch
              checked={settings.allowAccountDeletion}
              onCheckedChange={(checked) => updateSetting('allowAccountDeletion', checked)}
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
          {isSaving ? 'Saving...' : 'Save User Settings'}
        </Button>
      </div>

      <ProfileFieldTemplateManager />
    </div>
  );
};
