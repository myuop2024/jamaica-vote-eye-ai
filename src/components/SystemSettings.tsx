
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, RefreshCw, Bell, Shield, Database, Mail } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // General Settings
    systemName: 'Electoral Observation System',
    systemDescription: 'Comprehensive electoral monitoring platform',
    maintenanceMode: false,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    realTimeUpdates: true,
    reportNotifications: true,
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiration: 90,
    loginAttempts: 5,
    
    // Data Settings
    dataRetention: 365,
    autoBackup: true,
    exportEnabled: true,
    
    // Communication Settings
    smsProvider: 'twilio',
    emailProvider: 'sendgrid',
    whatsappEnabled: false
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Simulate API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Saved",
        description: "System settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8" />
            System Settings
          </h1>
          <p className="text-gray-600">Configure system preferences and parameters</p>
        </div>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => handleSettingChange('systemName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="systemDescription">System Description</Label>
              <Input
                id="systemDescription"
                value={settings.systemDescription}
                onChange={(e) => handleSettingChange('systemDescription', e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-gray-500">Temporarily disable user access</p>
              </div>
              <Switch
                id="maintenance"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="emailNotif">Email Notifications</Label>
              <Switch
                id="emailNotif"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="smsNotif">SMS Notifications</Label>
              <Switch
                id="smsNotif"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="realtimeNotif">Real-time Updates</Label>
              <Switch
                id="realtimeNotif"
                checked={settings.realTimeUpdates}
                onCheckedChange={(checked) => handleSettingChange('realTimeUpdates', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="reportNotif">Report Notifications</Label>
              <Switch
                id="reportNotif"
                checked={settings.reportNotifications}
                onCheckedChange={(checked) => handleSettingChange('reportNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <Switch
                id="twoFactor"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="passwordExp">Password Expiration (days)</Label>
              <Input
                id="passwordExp"
                type="number"
                value={settings.passwordExpiration}
                onChange={(e) => handleSettingChange('passwordExpiration', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="loginAttempts">Max Login Attempts</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={settings.loginAttempts}
                onChange={(e) => handleSettingChange('loginAttempts', parseInt(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="dataRetention">Data Retention Period (days)</Label>
              <Input
                id="dataRetention"
                type="number"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBackup">Automatic Backups</Label>
                <p className="text-sm text-gray-500">Daily automated backups</p>
              </div>
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleSettingChange('autoBackup', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="exportEnabled">Data Export</Label>
                <p className="text-sm text-gray-500">Allow data exports</p>
              </div>
              <Switch
                id="exportEnabled"
                checked={settings.exportEnabled}
                onCheckedChange={(checked) => handleSettingChange('exportEnabled', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Providers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Communication Providers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="smsProvider">SMS Provider</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="twilio"
                    name="smsProvider"
                    value="twilio"
                    checked={settings.smsProvider === 'twilio'}
                    onChange={(e) => handleSettingChange('smsProvider', e.target.value)}
                  />
                  <Label htmlFor="twilio">Twilio</Label>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="messagebird"
                    name="smsProvider"
                    value="messagebird"
                    checked={settings.smsProvider === 'messagebird'}
                    onChange={(e) => handleSettingChange('smsProvider', e.target.value)}
                  />
                  <Label htmlFor="messagebird">MessageBird</Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="emailProvider">Email Provider</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="sendgrid"
                    name="emailProvider"
                    value="sendgrid"
                    checked={settings.emailProvider === 'sendgrid'}
                    onChange={(e) => handleSettingChange('emailProvider', e.target.value)}
                  />
                  <Label htmlFor="sendgrid">SendGrid</Label>
                  <Badge variant="outline">Active</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="mailgun"
                    name="emailProvider"
                    value="mailgun"
                    checked={settings.emailProvider === 'mailgun'}
                    onChange={(e) => handleSettingChange('emailProvider', e.target.value)}
                  />
                  <Label htmlFor="mailgun">Mailgun</Label>
                </div>
              </div>
            </div>

            <div>
              <Label>WhatsApp Integration</Label>
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsapp">Enable WhatsApp</Label>
                  <Switch
                    id="whatsapp"
                    checked={settings.whatsappEnabled}
                    onCheckedChange={(checked) => handleSettingChange('whatsappEnabled', checked)}
                  />
                </div>
                {settings.whatsappEnabled && (
                  <Badge variant="secondary" className="mt-2">
                    Coming Soon
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
