
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';

export const DiditConnectionTest: React.FC = () => {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    connected: boolean;
    message: string;
    api_endpoint?: string;
  } | null>(null);

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('didit-verification', {
        body: { action: 'test_connection' }
      });

      if (error) throw error;

      setConnectionResult(data);
      
      if (data?.connected) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to Didit API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data?.error || "Failed to connect to Didit API",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionResult({
        connected: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      toast({
        title: "Test Failed",
        description: "Failed to test connection",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Didit API Connection Test
        </CardTitle>
        <CardDescription>
          Test the connection to Didit's identity verification service
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={testConnection}
            disabled={isTestingConnection}
            variant="outline"
          >
            {isTestingConnection ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {connectionResult && (
            <div className="flex items-center gap-2">
              {connectionResult.connected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    Connected
                  </Badge>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  <Badge variant="destructive">Failed</Badge>
                </>
              )}
            </div>
          )}
        </div>

        {connectionResult && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">Connection Result:</p>
            <p className="text-sm text-gray-600">{connectionResult.message}</p>
            {connectionResult.api_endpoint && (
              <p className="text-xs text-gray-500">
                API Endpoint: {connectionResult.api_endpoint}
              </p>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>This test verifies that:</p>
          <ul className="list-disc list-inside ml-2 mt-1">
            <li>Your API key is valid</li>
            <li>The Didit service is accessible</li>
            <li>The edge function is working correctly</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
