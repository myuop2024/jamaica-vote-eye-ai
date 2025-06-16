
export interface DiditVerification {
  id: string;
  user_id: string;
  didit_session_id?: string;
  verification_method: VerificationMethod;
  document_type?: DocumentType;
  status: VerificationResult;
  confidence_score?: number;
  extracted_data?: Record<string, unknown>;
  verification_metadata?: Record<string, unknown>;
  didit_response?: Record<string, unknown>;
  error_message?: string;
  expires_at?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DiditConfiguration {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description?: string;
  is_active?: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DiditAuditLog {
  id: string;
  verification_id?: string;
  user_id?: string;
  action: string;
  old_status?: VerificationResult;
  new_status?: VerificationResult;
  performed_by?: string;
  ip_address?: unknown;
  user_agent?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type VerificationMethod = 'document' | 'biometric' | 'liveness' | 'address' | 'phone' | 'email';
export type VerificationResult = 'pending' | 'verified' | 'failed' | 'expired' | 'cancelled';
export type DocumentType = 'passport' | 'drivers_license' | 'national_id' | 'voters_id' | 'birth_certificate' | 'utility_bill' | 'bank_statement';

export interface DiditSession {
  sessionId: string;
  clientUrl: string;
  status: string;
  verification_method: VerificationMethod;
  document_type?: DocumentType;
}

export interface DiditVerificationResult {
  success: boolean;
  confidence_score: number;
  extracted_data: Record<string, unknown>;
  verification_metadata: Record<string, unknown>;
  status: VerificationResult;
  error_message?: string;
}
