
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { initializeHereMapsService } from '@/services/hereMapsService';
import { HereMapsConfig } from './types';

export const useHereMapsSettings = () => {
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
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'here_maps_config')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading HERE Maps config:', error);
        setError(error.message);
      } else if (data?.value) {
        const savedConfig = data.value as unknown as HereMapsConfig;
        setConfig(savedConfig);
        
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
      const service = initializeHereMapsService(config.apiKey);
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

  return {
    config,
    isLoading,
    isTesting,
    error,
    saveConfig,
    testConnection,
    handleApiKeyChange
  };
};
