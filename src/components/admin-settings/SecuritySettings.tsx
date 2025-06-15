
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Key, Lock, Save } from 'lucide-react';
import { useSecuritySettings } from './security/useSecuritySettings';

export const SecuritySettings: React.FC = () => {
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings
  } = useSecuritySettings();

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
          <Shield className="w-8 h-8" />
          Security Settings
        </h1>
        <p className="text-gray-600">Configure authentication and security preferences</p>
      </div>

      {/* Authentication Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Authentication Settings
          </CardTitle>
          <CardDescription>
            Configure user authentication and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Email Verification</Label>
              <p className="text-sm text-gray-500">
                Users must verify their email before accessing the system
              </p>
            </div>
            <Switch
              checked={settings.requireEmailVerification}
              onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-gray-500">
                Enable 2FA for admin accounts
              </p>
            </div>
            <Switch
              checked={settings.enableTwoFactorAuth}
              onCheckedChange={(checked) => updateSetting('enableTwoFactorAuth', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 60)}
              placeholder="60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-login-attempts">Maximum Login Attempts</Label>
            <Input
              id="max-login-attempts"
              type="number"
              value={settings.maxLoginAttempts}
              onChange={(e) => updateSetting('maxLoginAttempts', parseInt(e.target.value) || 5)}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lockout-duration">Account Lockout Duration (minutes)</Label>
            <Input
              id="lockout-duration"
              type="number"
              value={settings.lockoutDuration}
              onChange={(e) => updateSetting('lockoutDuration', parseInt(e.target.value) || 30)}
              placeholder="30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Password Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password Policy
          </CardTitle>
          <CardDescription>
            Configure password requirements and policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-password-length">Minimum Password Length</Label>
            <Input
              id="min-password-length"
              type="number"
              value={settings.minPasswordLength}
              onChange={(e) => updateSetting('minPasswordLength', parseInt(e.target.value) || 8)}
              placeholder="8"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Uppercase Letters</Label>
              <p className="text-sm text-gray-500">
                Password must contain at least one uppercase letter
              </p>
            </div>
            <Switch
              checked={settings.requireUppercase}
              onCheckedChange={(checked) => updateSetting('requireUppercase', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Numbers</Label>
              <p className="text-sm text-gray-500">
                Password must contain at least one number
              </p>
            </div>
            <Switch
              checked={settings.requireNumbers}
              onCheckedChange={(checked) => updateSetting('requireNumbers', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Special Characters</Label>
              <p className="text-sm text-gray-500">
                Password must contain at least one special character
              </p>
            </div>
            <Switch
              checked={settings.requireSpecialChars}
              onCheckedChange={(checked) => updateSetting('requireSpecialChars', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-expiry">Password Expiry (days)</Label>
            <Input
              id="password-expiry"
              type="number"
              value={settings.passwordExpiryDays}
              onChange={(e) => updateSetting('passwordExpiryDays', parseInt(e.target.value) || 90)}
              placeholder="90"
            />
            <p className="text-sm text-gray-500">Set to 0 to disable password expiry</p>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Configure system access and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allowed-domains">Allowed Email Domains</Label>
            <Input
              id="allowed-domains"
              value={settings.allowedEmailDomains}
              onChange={(e) => updateSetting('allowedEmailDomains', e.target.value)}
              placeholder="example.com, company.org"
            />
            <p className="text-sm text-gray-500">Comma-separated list. Leave empty to allow all domains.</p>
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

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-approve Observers</Label>
              <p className="text-sm text-gray-500">
                Automatically approve new observer registrations
              </p>
            </div>
            <Switch
              checked={settings.autoApproveObservers}
              onCheckedChange={(checked) => updateSetting('autoApproveObservers', checked)}
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
          {isSaving ? 'Saving...' : 'Save Security Settings'}
        </Button>
      </div>
    </div>
  );
};
