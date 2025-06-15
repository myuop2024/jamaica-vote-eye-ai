
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeHereMapsService, getHereMapsService } from '@/services/hereMapsService';

interface HereMapsConfig {
  apiKey: string;
  isConfigured: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'error';
  testMessage?: string;
}

export const HereMapsSettings: React.FC = () => {
  const [config, setConfig] = useState<HereMapsConfig>({
    apiKey: '',
    isConfigured: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      // Query the system_settings table directly
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'here_maps_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading HERE Maps config:', error);
        setError(error.message);
      } else if (data?.value) {
        // Safely convert the Json value to HereMapsConfig
        const savedConfig = data.value as unknown as HereMapsConfig;
        setConfig(savedConfig);
        
        // Initialize service if API key exists
        if (savedConfig.apiKey) {
          initializeHereMapsService(savedConfig.apiKey);
        }
      }
    } catch (error: any) {
      console.error('Error loading HERE Maps config:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config.apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const configToSave = {
        ...config,
        apiKey: config.apiKey.trim(),
        isConfigured: true
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'here_maps_config',
          value: configToSave,
          description: 'HERE Maps API configuration'
        });

      if (error) throw error;

      setConfig(configToSave);
      
      // Initialize service with new API key
      initializeHereMapsService(configToSave.apiKey);

      toast({
        title: 'Success',
        description: 'HERE Maps configuration saved successfully.',
      });

    } catch (error: any) {
      console.error('Error saving HERE Maps config:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    if (!config.apiKey) {
      setError('Please enter an API key first');
      return;
    }

    setIsTesting(true);
    setError(null);

    try {
      // Initialize service with current API key
      const service = initializeHereMapsService(config.apiKey);
      
      // Test with a known Jamaica address
      const results = await service.geocodeAddress('Kingston, Jamaica');
      
      if (results.length > 0) {
        const updatedConfig = {
          ...config,
          testStatus: 'success' as const,
          testMessage: `Found ${results.length} results for Kingston, Jamaica`,
          lastTested: new Date().toISOString()
        };
        
        setConfig(updatedConfig);
        
        toast({
          title: 'Connection Test Successful',
          description: 'HERE Maps API is working correctly.',
        });
      } else {
        throw new Error('No results found for test query');
      }
      
    } catch (error: any) {
      console.error('HERE Maps test error:', error);
      
      const updatedConfig = {
        ...config,
        testStatus: 'error' as const,
        testMessage: error.message || 'Connection test failed',
        lastTested: new Date().toISOString()
      };
      
      setConfig(updatedConfig);
      setError(error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setConfig(prev => ({ ...prev, apiKey: value }));
    if (error) setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            HERE Maps Configuration
          </CardTitle>
          <CardDescription>
            Configure HERE Maps API for address geocoding, places search, and location services.
            Optimized for Jamaica.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">API Configuration</h4>
              {config.isConfigured && (
                <Badge variant={config.testStatus === 'success' ? 'default' : 'destructive'}>
                  {config.testStatus === 'success' ? 'Configured' : 'Error'}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="here-api-key">HERE Maps API Key</Label>
              <Input
                id="here-api-key"
                type="password"
                value={config.apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder="Enter your HERE Maps API key"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Get your API key from{' '}
                <a 
                  href="https://developer.here.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  HERE Developer Portal
                  <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={saveConfig}
                disabled={isLoading || !config.apiKey.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Configuration'
                )}
              </Button>

              <Button
                variant="outline"
                onClick={testConnection}
                disabled={isTesting || !config.apiKey.trim()}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>

            {config.lastTested && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {config.testStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-gray-600">
                    Last tested: {new Date(config.lastTested).toLocaleString()}
                  </span>
                </div>
                {config.testMessage && (
                  <p className="text-sm text-gray-600 ml-6">
                    {config.testMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jamaica Optimization</CardTitle>
          <CardDescription>
            This configuration is optimized for Jamaican addresses and locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Geocoding biased to Jamaica bounding box</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Parish validation for 14 Jamaican parishes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Address formatting for Jamaican addresses</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Places search centered on Jamaica</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
