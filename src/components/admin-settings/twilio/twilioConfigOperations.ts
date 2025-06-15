
import { supabase } from '@/integrations/supabase/client';
import { TwilioSettings } from './types';

export const loadTwilioSettings = async (): Promise<TwilioSettings> => {
  const { data: configData, error } = await supabase
    .from('didit_configuration')
    .select('setting_key, setting_value, is_active')
    .in('setting_key', ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER', 'TWILIO_ENABLED']);

  if (error) {
    console.error('Error loading Twilio settings:', error);
    throw error;
  }

  const defaultSettings: TwilioSettings = {
    accountSid: '',
    authToken: '',
    fromNumber: '',
    enabled: true,
    webhookUrl: '',
    statusCallbackUrl: ''
  };

  if (configData && configData.length > 0) {
    const config = configData.reduce((acc, item) => {
      // Safely extract the value from the Json type
      let value: any;
      if (typeof item.setting_value === 'object' && item.setting_value !== null && 'value' in item.setting_value) {
        value = (item.setting_value as any).value;
      } else {
        value = item.setting_value;
      }
      acc[item.setting_key] = value;
      return acc;
    }, {} as Record<string, any>);

    return {
      ...defaultSettings,
      accountSid: config.TWILIO_ACCOUNT_SID || '',
      authToken: config.TWILIO_AUTH_TOKEN || '',
      fromNumber: config.TWILIO_FROM_NUMBER || '',
      enabled: config.TWILIO_ENABLED !== false
    };
  }

  return defaultSettings;
};

export const saveTwilioSettings = async (settings: TwilioSettings) => {
  if (!settings.accountSid || !settings.authToken || !settings.fromNumber) {
    throw new Error('Account SID, Auth Token, and From Number are required');
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

  if (!data.success) {
    throw new Error(data.message || 'Failed to save settings');
  }

  return data;
};
