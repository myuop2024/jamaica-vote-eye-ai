
import { supabase } from '@/integrations/supabase/client';
import { TestResult } from './types';

export const testTwilioConnection = async (accountSid: string, authToken: string, fromNumber: string): Promise<TestResult> => {
  if (!accountSid || !authToken) {
    return {
      success: false,
      message: "Account SID and Auth Token are required for testing"
    };
  }

  const { data, error } = await supabase.functions.invoke('test-twilio-connection', {
    body: {
      accountSid,
      authToken,
      fromNumber
    }
  });

  if (error) throw error;

  if (data.success) {
    return {
      success: true,
      message: "Connection successful! Twilio is properly configured.",
      details: data.details
    };
  } else {
    return {
      success: false,
      message: data.message || "Connection failed",
      details: data.details
    };
  }
};

export const sendTestSMS = async (fromNumber: string, testNumber: string) => {
  if (!fromNumber) {
    throw new Error('From Number is required to send test SMS');
  }

  const { data, error } = await supabase.functions.invoke('send-sms', {
    body: {
      to: testNumber,
      message: 'Test SMS from Electoral Observation System - Twilio integration working!',
      campaignId: 'test'
    }
  });

  if (error) throw error;

  if (!data.success) {
    throw new Error(data.error || 'Failed to send test SMS');
  }

  return data;
};
