
-- Create encryption configuration table
CREATE TABLE public.encryption_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  key_version INTEGER NOT NULL DEFAULT 1,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  key_status TEXT NOT NULL DEFAULT 'active' CHECK (key_status IN ('active', 'rotating', 'deprecated')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  compliance_level TEXT NOT NULL DEFAULT 'FIPS-140-2' CHECK (compliance_level IN ('FIPS-140-2', 'Common-Criteria', 'NSA-Suite-B'))
);

-- Create audit log for encryption operations
CREATE TABLE public.encryption_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('encrypt', 'decrypt', 'key_rotation', 'key_access', 'authentication')),
  user_id UUID,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  encryption_algorithm TEXT,
  key_version INTEGER,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create secure sessions table for enhanced authentication
CREATE TABLE public.secure_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  session_token_hash TEXT NOT NULL,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  encryption_level TEXT NOT NULL DEFAULT 'military' CHECK (encryption_level IN ('standard', 'enhanced', 'military')),
  mfa_verified BOOLEAN NOT NULL DEFAULT false,
  risk_assessment JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook security configuration
CREATE TABLE public.webhook_security (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_name TEXT NOT NULL UNIQUE,
  signing_algorithm TEXT NOT NULL DEFAULT 'HMAC-SHA256',
  key_rotation_interval INTEGER NOT NULL DEFAULT 30, -- days
  current_key_version INTEGER NOT NULL DEFAULT 1,
  mtls_required BOOLEAN NOT NULL DEFAULT true,
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 100,
  allowed_ips JSONB DEFAULT '[]',
  compliance_requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create data classification table
CREATE TABLE public.data_classification (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  classification_level TEXT NOT NULL CHECK (classification_level IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET')),
  encryption_required BOOLEAN NOT NULL DEFAULT true,
  retention_period_days INTEGER,
  access_control_policy JSONB DEFAULT '{}',
  audit_requirements JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_name, column_name)
);

-- Add encryption metadata to existing tables
ALTER TABLE public.profiles ADD COLUMN encryption_metadata JSONB DEFAULT '{}';
ALTER TABLE public.observation_reports ADD COLUMN encryption_metadata JSONB DEFAULT '{}';
ALTER TABLE public.didit_verifications ADD COLUMN encryption_metadata JSONB DEFAULT '{}';
ALTER TABLE public.communications ADD COLUMN encryption_metadata JSONB DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.encryption_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_security ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_classification ENABLE ROW LEVEL SECURITY;

-- Create policies for encryption_config (admin only)
CREATE POLICY "Admins can manage encryption config" 
  ON public.encryption_config 
  FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create policies for encryption_audit_log (admin read, system write)
CREATE POLICY "Admins can view encryption audit logs" 
  ON public.encryption_audit_log 
  FOR SELECT 
  USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "System can write encryption audit logs" 
  ON public.encryption_audit_log 
  FOR INSERT 
  WITH CHECK (true);

-- Create policies for secure_sessions (users can view their own)
CREATE POLICY "Users can view their own secure sessions" 
  ON public.secure_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage secure sessions" 
  ON public.secure_sessions 
  FOR ALL 
  USING (true);

-- Create policies for webhook_security (admin only)
CREATE POLICY "Admins can manage webhook security" 
  ON public.webhook_security 
  FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create policies for data_classification (admin only)
CREATE POLICY "Admins can manage data classification" 
  ON public.data_classification 
  FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create indexes for performance
CREATE INDEX idx_encryption_audit_log_user_id ON public.encryption_audit_log(user_id);
CREATE INDEX idx_encryption_audit_log_created_at ON public.encryption_audit_log(created_at);
CREATE INDEX idx_encryption_audit_log_operation_type ON public.encryption_audit_log(operation_type);
CREATE INDEX idx_secure_sessions_user_id ON public.secure_sessions(user_id);
CREATE INDEX idx_secure_sessions_expires_at ON public.secure_sessions(expires_at);
CREATE INDEX idx_secure_sessions_session_token_hash ON public.secure_sessions(session_token_hash);

-- Insert default encryption configuration
INSERT INTO public.encryption_config (key_name, algorithm, compliance_level, metadata) VALUES
('master_key_v1', 'AES-256-GCM', 'FIPS-140-2', '{"purpose": "master_encryption", "hsm_backed": true}'),
('data_encryption_v1', 'AES-256-GCM', 'FIPS-140-2', '{"purpose": "data_at_rest", "key_derivation": "PBKDF2"}'),
('transit_encryption_v1', 'ChaCha20-Poly1305', 'NSA-Suite-B', '{"purpose": "data_in_transit", "forward_secrecy": true}'),
('signature_key_v1', 'Ed25519', 'FIPS-140-2', '{"purpose": "digital_signatures", "curve": "edwards25519"}');

-- Insert default data classification
INSERT INTO public.data_classification (table_name, column_name, classification_level, encryption_required, retention_period_days) VALUES
('profiles', 'name', 'CONFIDENTIAL', true, 2555), -- 7 years
('profiles', 'email', 'CONFIDENTIAL', true, 2555),
('profiles', 'phone_number', 'CONFIDENTIAL', true, 2555),
('profiles', 'trn', 'SECRET', true, 2555),
('profiles', 'bank_account_number', 'SECRET', true, 2555),
('observation_reports', 'report_text', 'CONFIDENTIAL', true, 2555),
('observation_reports', 'location_data', 'CONFIDENTIAL', true, 2555),
('didit_verifications', 'extracted_data', 'SECRET', true, 2555),
('didit_verifications', 'didit_response', 'SECRET', true, 2555),
('communications', 'message_content', 'INTERNAL', true, 365);

-- Insert default webhook security configuration
INSERT INTO public.webhook_security (webhook_name, signing_algorithm, mtls_required, rate_limit_per_minute) VALUES
('didit_webhook', 'HMAC-SHA256', true, 50),
('twilio_webhook', 'HMAC-SHA256', true, 100),
('system_notifications', 'Ed25519', true, 200);
