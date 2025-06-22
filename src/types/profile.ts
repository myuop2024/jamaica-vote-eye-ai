
import { User } from '@/types/auth';

export type ProfileFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'file';

export interface ProfileFieldTemplate {
  id: number;
  label: string;
  field_key: string;
  type: ProfileFieldType;
  options?: string[];
  required: boolean;
  validation?: string;
  order: number;
  default_value?: string;
  visible_to_user: boolean;
  admin_only: boolean;
  created_at: string;
  updated_at: string;
  roles?: ('admin' | 'observer' | 'roving_observer' | 'parish_coordinator')[];
}

export type ProfileData = Record<string, unknown>;

// Add UserProfile interface that extends User
export interface UserProfile extends User {
  phone_number?: string; // Database field name
}
