
export interface TwilioSettings {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  enabled: boolean;
  webhookUrl: string;
  statusCallbackUrl: string;
}

export interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export type ConnectionStatus = 'unknown' | 'connected' | 'error';
