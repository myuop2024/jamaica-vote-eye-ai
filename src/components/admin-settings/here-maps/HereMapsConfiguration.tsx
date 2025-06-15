
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, ExternalLink, MapPin } from 'lucide-react';
import { HereMapsConfig } from './types';

interface HereMapsConfigurationProps {
  config: HereMapsConfig;
  isLoading: boolean;
  isTesting: boolean;
  error: string | null;
  onApiKeyChange: (value: string) => void;
  onSave: () => void;
  onTest: () => void;
}

export const HereMapsConfiguration: React.FC<HereMapsConfigurationProps> = ({
  config,
  isLoading,
  isTesting,
  error,
  onApiKeyChange,
  onSave,
  onTest
}) => {
  return (
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
              onChange={(e) => onApiKeyChange(e.target.value)}
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
              onClick={onSave}
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
              onClick={onTest}
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
  );
};
