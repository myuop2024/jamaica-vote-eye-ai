
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Mail, Send, Save } from 'lucide-react';
import { useCommunicationsSettings } from './communications/useCommunicationsSettings';

export const CommunicationsSettings: React.FC = () => {
  const {
    settings,
    updateSetting,
    isLoading,
    isSaving,
    saveSettings
  } = useCommunicationsSettings();

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
          <MessageSquare className="w-8 h-8" />
          Communications Settings
        </h1>
        <p className="text-gray-600">Configure email and SMS provider settings</p>
      </div>

      {/* Email Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Provider Configuration
          </CardTitle>
          <CardDescription>
            Configure SMTP settings for sending emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Service</Label>
              <p className="text-sm text-gray-500">
                Enable email functionality for the system
              </p>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={(checked) => updateSetting('emailEnabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email-provider">Email Provider</Label>
            <Select
              value={settings.emailProvider}
              onValueChange={(value) => updateSetting('emailProvider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select email provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smtp">Custom SMTP</SelectItem>
                <SelectItem value="sendgrid">SendGrid</SelectItem>
                <SelectItem value="mailgun">Mailgun</SelectItem>
                <SelectItem value="ses">Amazon SES</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input
                id="smtp-host"
                value={settings.smtpHost}
                onChange={(e) => updateSetting('smtpHost', e.target.value)}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input
                id="smtp-port"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => updateSetting('smtpPort', parseInt(e.target.value) || 587)}
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-username">SMTP Username</Label>
              <Input
                id="smtp-username"
                value={settings.smtpUsername}
                onChange={(e) => updateSetting('smtpUsername', e.target.value)}
                placeholder="username@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input
                id="smtp-password"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Use TLS/SSL</Label>
              <p className="text-sm text-gray-500">
                Enable secure connection for SMTP
              </p>
            </div>
            <Switch
              checked={settings.smtpTls}
              onCheckedChange={(checked) => updateSetting('smtpTls', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Default Message Templates
          </CardTitle>
          <CardDescription>
            Configure default templates for system communications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="registration-email">Registration Email Template</Label>
            <Textarea
              id="registration-email"
              value={settings.registrationEmailTemplate}
              onChange={(e) => updateSetting('registrationEmailTemplate', e.target.value)}
              placeholder="Welcome! Please verify your email address..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-reset-email">Password Reset Email Template</Label>
            <Textarea
              id="password-reset-email"
              value={settings.passwordResetEmailTemplate}
              onChange={(e) => updateSetting('passwordResetEmailTemplate', e.target.value)}
              placeholder="Click the link below to reset your password..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome-sms">Welcome SMS Template</Label>
            <Textarea
              id="welcome-sms"
              value={settings.welcomeSmsTemplate}
              onChange={(e) => updateSetting('welcomeSmsTemplate', e.target.value)}
              placeholder="Welcome to the Electoral Observation System!"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-sms">Phone Verification SMS Template</Label>
            <Textarea
              id="verification-sms"
              value={settings.verificationSmsTemplate}
              onChange={(e) => updateSetting('verificationSmsTemplate', e.target.value)}
              placeholder="Your verification code is: {code}"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Limits</CardTitle>
          <CardDescription>
            Configure rate limits and sending quotas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-rate-limit">Email Rate Limit (per hour)</Label>
              <Input
                id="email-rate-limit"
                type="number"
                value={settings.emailRateLimit}
                onChange={(e) => updateSetting('emailRateLimit', parseInt(e.target.value) || 100)}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-rate-limit">SMS Rate Limit (per hour)</Label>
              <Input
                id="sms-rate-limit"
                type="number"
                value={settings.smsRateLimit}
                onChange={(e) => updateSetting('smsRateLimit', parseInt(e.target.value) || 50)}
                placeholder="50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="daily-email-limit">Daily Email Limit</Label>
              <Input
                id="daily-email-limit"
                type="number"
                value={settings.dailyEmailLimit}
                onChange={(e) => updateSetting('dailyEmailLimit', parseInt(e.target.value) || 1000)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily-sms-limit">Daily SMS Limit</Label>
              <Input
                id="daily-sms-limit"
                type="number"
                value={settings.dailySmsLimit}
                onChange={(e) => updateSetting('dailySmsLimit', parseInt(e.target.value) || 500)}
                placeholder="500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Anti-Spam Protection</Label>
              <p className="text-sm text-gray-500">
                Prevent duplicate messages and spam protection
              </p>
            </div>
            <Switch
              checked={settings.enableAntiSpam}
              onCheckedChange={(checked) => updateSetting('enableAntiSpam', checked)}
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
          {isSaving ? 'Saving...' : 'Save Communications Settings'}
        </Button>
      </div>
    </div>
  );
};
