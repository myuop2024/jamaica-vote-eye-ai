
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, TestTube, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { TwilioSettings } from './types';

interface TwilioConfigurationFormProps {
  settings: TwilioSettings;
  setSettings: React.Dispatch<React.SetStateAction<TwilioSettings>>;
  isSaving: boolean;
  isTesting: boolean;
  connectionStatus: 'unknown' | 'connected' | 'error';
  showApiKeys: boolean;
  setShowApiKeys: (show: boolean) => void;
  onSave: () => void;
  onTestConnection: () => void;
  onSendTestSMS: () => void;
}

export const TwilioConfigurationForm: React.FC<TwilioConfigurationFormProps> = ({
  settings,
  setSettings,
  isSaving,
  isTesting,
  connectionStatus,
  showApiKeys,
  setShowApiKeys,
  onSave,
  onTestConnection,
  onSendTestSMS
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountSid">Account SID</Label>
            <Input
              id="accountSid"
              type={showApiKeys ? "text" : "password"}
              value={settings.accountSid}
              onChange={(e) => setSettings(prev => ({ ...prev, accountSid: e.target.value }))}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div>
            <Label htmlFor="authToken">Auth Token</Label>
            <div className="relative">
              <Input
                id="authToken"
                type={showApiKeys ? "text" : "password"}
                value={settings.authToken}
                onChange={(e) => setSettings(prev => ({ ...prev, authToken: e.target.value }))}
                placeholder="Your Twilio Auth Token"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowApiKeys(!showApiKeys)}
              >
                {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="fromNumber">From Phone Number</Label>
          <Input
            id="fromNumber"
            value={settings.fromNumber}
            onChange={(e) => setSettings(prev => ({ ...prev, fromNumber: e.target.value }))}
            placeholder="+1234567890"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
            <Input
              id="webhookUrl"
              value={settings.webhookUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, webhookUrl: e.target.value }))}
              placeholder="https://your-domain.com/twilio/webhook"
            />
          </div>
          <div>
            <Label htmlFor="statusCallbackUrl">Status Callback URL (Optional)</Label>
            <Input
              id="statusCallbackUrl"
              value={settings.statusCallbackUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, statusCallbackUrl: e.target.value }))}
              placeholder="https://your-domain.com/twilio/status"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="enabled">Enable Twilio SMS</Label>
            <p className="text-sm text-gray-500">Allow SMS sending through Twilio</p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onSave}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
          
          <Button 
            onClick={onTestConnection}
            disabled={isTesting || !settings.accountSid || !settings.authToken}
            variant="outline"
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Testing...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          <Button 
            onClick={onSendTestSMS}
            disabled={isTesting || !settings.fromNumber || connectionStatus !== 'connected'}
            variant="outline"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Test SMS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
