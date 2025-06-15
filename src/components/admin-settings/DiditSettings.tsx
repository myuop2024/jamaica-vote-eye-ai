import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Save, RefreshCw, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

interface DiditConfig {
  verification_timeout: number;
  required_confidence_threshold: number;
  auto_approve_threshold: number;
  enabled_verification_methods: string[];
  document_types_allowed: string[];
  webhook_enabled: boolean;
  webhook_url?: string;
  api_environment: 'sandbox' | 'production';
  workflow_id?: string;
}

export const DiditSettings: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<DiditConfig>({
    verification_timeout: 3600,
    required_confidence_threshold: 0.8,
    auto_approve_threshold: 0.95,
    enabled_verification_methods: ['document', 'liveness'],
    document_types_allowed: ['passport', 'drivers_license', 'national_id', 'voters_id'],
    webhook_enabled: false,
    api_environment: 'sandbox',
    workflow_id: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const verificationMethods = [
    { value: 'document', label: 'Document Verification' },
    { value: 'liveness', label: 'Liveness Detection' },
    { value: 'biometric', label: 'Biometric Verification' },
    { value: 'address', label: 'Address Verification' },
    { value: 'phone', label: 'Phone Verification' },
    { value: 'email', label: 'Email Verification' }
  ];

  const documentTypes = [
    { value: 'passport', label: 'Passport' },
    { value: 'drivers_license', label: 'Driver\'s License' },
    { value: 'national_id', label: 'National ID' },
    { value: 'voters_id', label: 'Voter\'s ID' },
    { value: 'birth_certificate', label: 'Birth Certificate' },
    { value: 'utility_bill', label: 'Utility Bill' },
    { value: 'bank_statement', label: 'Bank Statement' }
  ];

  useEffect(() => {
    fetchDiditConfiguration();
    testDiditConnection();
  }, []);

  const fetchDiditConfiguration = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('didit_configuration')
        .select('setting_key, setting_value')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        const configMap = data.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {} as any);

        setConfig({
          verification_timeout: parseInt(configMap.verification_timeout) || 3600,
          required_confidence_threshold: parseFloat(configMap.required_confidence_threshold) || 0.8,
          auto_approve_threshold: parseFloat(configMap.auto_approve_threshold) || 0.95,
          enabled_verification_methods: JSON.parse(configMap.enabled_verification_methods || '["document", "liveness"]'),
          document_types_allowed: JSON.parse(configMap.document_types_allowed || '["passport", "drivers_license", "national_id", "voters_id"]'),
          webhook_enabled: configMap.webhook_enabled === 'true',
          webhook_url: configMap.webhook_url,
          api_environment: configMap.api_environment || 'sandbox',
          workflow_id: configMap.workflow_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching didit configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load didit configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testDiditConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('didit-verification', {
        body: { action: 'test_connection' }
      });
      
      if (error) throw error;
      setConnectionStatus(data?.connected ? 'connected' : 'error');
    } catch (error) {
      console.error('Didit connection test failed:', error);
      setConnectionStatus('error');
    }
  };

  const handleSaveConfiguration = async () => {
    setIsSaving(true);
    try {
      const configEntries = [
        { key: 'verification_timeout', value: config.verification_timeout.toString() },
        { key: 'required_confidence_threshold', value: config.required_confidence_threshold.toString() },
        { key: 'auto_approve_threshold', value: config.auto_approve_threshold.toString() },
        { key: 'enabled_verification_methods', value: JSON.stringify(config.enabled_verification_methods) },
        { key: 'document_types_allowed', value: JSON.stringify(config.document_types_allowed) },
        { key: 'webhook_enabled', value: config.webhook_enabled.toString() },
        { key: 'webhook_url', value: config.webhook_url || '' },
        { key: 'api_environment', value: config.api_environment },
        { key: 'workflow_id', value: config.workflow_id || '' }
      ];

      for (const entry of configEntries) {
        const { error } = await supabase
          .from('didit_configuration')
          .upsert({
            setting_key: entry.key,
            setting_value: entry.value,
            is_active: true
          }, {
            onConflict: 'setting_key'
          });

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Didit configuration has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving didit configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save didit configuration",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMethodToggle = (method: string) => {
    setConfig(prev => ({
      ...prev,
      enabled_verification_methods: prev.enabled_verification_methods.includes(method)
        ? prev.enabled_verification_methods.filter(m => m !== method)
        : [...prev.enabled_verification_methods, method]
    }));
  };

  const handleDocumentTypeToggle = (docType: string) => {
    setConfig(prev => ({
      ...prev,
      document_types_allowed: prev.document_types_allowed.includes(docType)
        ? prev.document_types_allowed.filter(d => d !== docType)
        : [...prev.document_types_allowed, docType]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Didit Identity Verification Settings
          </h1>
          <p className="text-gray-600">Configure identity verification parameters and thresholds</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-green-700 border-green-300">Connected</Badge>
              </>
            ) : connectionStatus === 'error' ? (
              <>
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <Badge variant="destructive">Disconnected</Badge>
              </>
            ) : (
              <Badge variant="secondary">Testing...</Badge>
            )}
          </div>
          <Button 
            onClick={handleSaveConfiguration}
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflow Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Workflow Configuration
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://business.didit.me', '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Didit Console
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="workflow-id">Workflow ID</Label>
              <Input
                id="workflow-id"
                placeholder="Enter your Didit workflow ID"
                value={config.workflow_id}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  workflow_id: e.target.value
                }))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Create and configure workflows in the Didit Business Console
              </p>
            </div>
            
            <div>
              <Label htmlFor="environment">API Environment</Label>
              <Select
                value={config.api_environment}
                onValueChange={(value: 'sandbox' | 'production') => 
                  setConfig(prev => ({ ...prev, api_environment: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Current API endpoint: https://verification.didit.me/v2
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Verification Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="confidence-threshold">Required Confidence Score</Label>
              <Input
                id="confidence-threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={config.required_confidence_threshold}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  required_confidence_threshold: parseFloat(e.target.value)
                }))}
              />
              <p className="text-sm text-gray-500 mt-1">Minimum confidence score to accept verification (0.0 - 1.0)</p>
            </div>
            
            <div>
              <Label htmlFor="auto-approve-threshold">Auto-Approve Threshold</Label>
              <Input
                id="auto-approve-threshold"
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={config.auto_approve_threshold}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  auto_approve_threshold: parseFloat(e.target.value)
                }))}
              />
              <p className="text-sm text-gray-500 mt-1">Score above which verifications are automatically approved</p>
            </div>

            <div>
              <Label htmlFor="timeout">Session Timeout (seconds)</Label>
              <Input
                id="timeout"
                type="number"
                min="300"
                max="7200"
                value={config.verification_timeout}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  verification_timeout: parseInt(e.target.value)
                }))}
              />
              <p className="text-sm text-gray-500 mt-1">How long verification sessions remain active</p>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="webhook">Enable Webhooks</Label>
                <p className="text-sm text-gray-500">Receive real-time verification updates</p>
              </div>
              <Switch
                id="webhook"
                checked={config.webhook_enabled}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  webhook_enabled: checked
                }))}
              />
            </div>

            {config.webhook_enabled && (
              <div>
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-domain.com/webhook"
                  value={config.webhook_url || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    webhook_url: e.target.value
                  }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Default: {window.location.origin}/functions/v1/didit-verification
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verification Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Enabled Verification Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationMethods.map((method) => (
                <div key={method.value} className="flex items-center justify-between">
                  <Label htmlFor={method.value}>{method.label}</Label>
                  <Switch
                    id={method.value}
                    checked={config.enabled_verification_methods.includes(method.value)}
                    onCheckedChange={() => handleMethodToggle(method.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Types */}
        <Card>
          <CardHeader>
            <CardTitle>Accepted Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentTypes.map((docType) => (
                <div key={docType.value} className="flex items-center justify-between">
                  <Label htmlFor={docType.value}>{docType.label}</Label>
                  <Switch
                    id={docType.value}
                    checked={config.document_types_allowed.includes(docType.value)}
                    onCheckedChange={() => handleDocumentTypeToggle(docType.value)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
