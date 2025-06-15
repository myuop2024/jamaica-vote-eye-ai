
export interface HereMapsConfig {
  apiKey: string;
  isConfigured: boolean;
  lastTested?: string;
  testStatus?: 'success' | 'error';
  testMessage?: string;
}
