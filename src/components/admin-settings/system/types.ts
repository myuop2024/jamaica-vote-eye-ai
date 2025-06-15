
export interface SystemFormData {
  systemName: string;
  systemVersion: string;
  systemDescription: string;
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupRetentionDays: number;
  apiRateLimit: number;
  sessionTimeout: number;
  enableApiLogging: boolean;
}

export interface SystemSettingsData extends SystemFormData {
  id?: string;
  updatedAt?: string;
  updatedBy?: string;
}
