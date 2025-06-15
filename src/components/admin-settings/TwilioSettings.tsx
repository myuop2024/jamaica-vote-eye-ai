
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Settings, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Phone, 
  MessageSquare,
  AlertTriangle,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';

export const TwilioSettings: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  const [settings, setSettings] = useState({
    accountSid: '',
    authToken: '',
    fromNumber: '',
    enabled: true,
    webhookUrl: '',
    statusCallbackUrl: ''
  });

  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  useEffect(() => {
    loadTwilioSettings();
  }, []);

  const loadTwilioSettings = async () => {
    try {
      setIsLoading(true);
      
      // Load settings from the didit_configuration table
      const { data: configData, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value, is_active')
        .in('setting_key', ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER', 'TWILIO_ENABLED']);

      if (error) {
        console.error('Error loading Twilio settings:', error);
        return;
      }

      if (configData && configData.length > 0) {
        const config = configData.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value.value;
          return acc;
        }, {} as Record<string, any>);

        setSettings(prev => ({
          ...prev,
          accountSid: config.TWILIO_ACCOUNT_SID || '',
          authToken: config.TWILIO_AUTH_TOKEN || '',
          fromNumber: config.TWILIO_FROM_NUMBER || '',
          enabled: config.TWILIO_ENABLED !== false
        }));

        if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN) {
          setConnectionStatus('unknown'); // Reset to allow re-testing
        }
      }
      
      toast({
        title: "Settings Loaded",
        description: "Twilio configuration loaded successfully"
      });
    } catch (error: any) {
      console.error('Error loading Twilio settings:', error);
      toast({
        title: "Error",
        description: "Failed to load Twilio settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Validate required fields
      if (!settings.accountSid || !settings.authToken || !settings.fromNumber) {
        toast({
          title: "Validation Error",
          description: "Account SID, Auth Token, and From Number are required",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('save-twilio-settings', {
        body: {
          accountSid: settings.accountSid,
          authToken: settings.authToken,
          fromNumber: settings.fromNumber,
          enabled: settings.enabled
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Settings Saved",
          description: "Twilio configuration has been updated successfully"
        });
        setConnectionStatus('unknown');
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
      
    } catch (error: any) {
      console.error('Error saving Twilio settings:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save Twilio settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testTwilioConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);

      if (!settings.accountSid || !settings.authToken) {
        setTestResult({
          success: false,
          message: "Account SID and Auth Token are required for testing"
        });
        return;
      }

      // Call the edge function to test Twilio connection
      const { data, error } = await supabase.functions.invoke('test-twilio-connection', {
        body: {
          accountSid: settings.accountSid,
          authToken: settings.authToken,
          fromNumber: settings.fromNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus('connected');
        setTestResult({
          success: true,
          message: "Connection successful! Twilio is properly configured.",
          details: data.details
        });
      } else {
        setConnectionStatus('error');
        setTestResult({
          success: false,
          message: data.message || "Connection failed",
          details: data.details
        });
      }

    } catch (error: any) {
      console.error('Error testing Twilio connection:', error);
      setConnectionStatus('error');
      setTestResult({
        success: false,
        message: error.message || "Failed to test connection"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sendTestSMS = async () => {
    try {
      setIsTesting(true);
      
      if (!settings.fromNumber) {
        toast({
          title: "Error",
          description: "From Number is required to send test SMS",
          variant: "destructive"
        });
        return;
      }

      // First, we need to save the settings before sending SMS
      if (connectionStatus !== 'connected') {
        toast({
          title: "Info",
          description: "Please save your settings and test the connection first",
          variant: "default"
        });
        return;
      }

      // You would implement a test phone number input here
      const testNumber = prompt('Enter a test phone number (with country code, e.g., +1234567890):');
      if (!testNumber) return;
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: testNumber,
          message: 'Test SMS from Electoral Observation System - Twilio integration working!',
          campaignId: 'test'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Test SMS Sent",
          description: `Test message sent successfully to ${testNumber}`,
        });
      } else {
        throw new Error(data.error || 'Failed to send test SMS');
      }

    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test SMS. Make sure your settings are saved and connection is tested first.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading && !settings.accountSid) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-8 h-8" />
            Twilio SMS Configuration
          </h1>
          <p className="text-gray-600">Configure Twilio SMS service for communication campaigns</p>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Main Configuration */}
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
              onClick={handleSaveSettings}
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
              onClick={testTwilioConnection}
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
              onClick={sendTestSMS}
              disabled={isTesting || !settings.fromNumber || connectionStatus !== 'connected'}
              variant="outline"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Test SMS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardContent className="pt-6">
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription>
                <strong>{testResult.success ? 'Success:' : 'Error:'}</strong> {testResult.message}
                {testResult.details && (
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Configuration Help */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>Account SID:</strong> Your primary Twilio identifier (starts with AC)</p>
            <p><strong>Auth Token:</strong> Your secret authentication token from Twilio Console</p>
            <p><strong>From Number:</strong> Your verified Twilio phone number for sending SMS</p>
            <p><strong>Webhook URL:</strong> Optional endpoint to receive delivery status updates</p>
            <p><strong>Status Callback:</strong> Optional endpoint to receive message status changes</p>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Settings are now securely stored in the database. 
              Make sure to save your configuration and test the connection before sending SMS messages.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
