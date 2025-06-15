
-- Create enum types for didit integration
CREATE TYPE public.verification_method AS ENUM ('document', 'biometric', 'liveness', 'address', 'phone', 'email');
CREATE TYPE public.verification_result AS ENUM ('pending', 'verified', 'failed', 'expired', 'cancelled');
CREATE TYPE public.document_type AS ENUM ('passport', 'drivers_license', 'national_id', 'voters_id', 'birth_certificate', 'utility_bill', 'bank_statement');

-- Create didit_verifications table
CREATE TABLE public.didit_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  didit_session_id TEXT UNIQUE,
  verification_method verification_method NOT NULL,
  document_type document_type,
  status verification_result NOT NULL DEFAULT 'pending',
  confidence_score DECIMAL(3,2),
  extracted_data JSONB,
  verification_metadata JSONB,
  didit_response JSONB,
  error_message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create didit_audit_log table for compliance
CREATE TABLE public.didit_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID REFERENCES public.didit_verifications(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_status verification_result,
  new_status verification_result,
  performed_by UUID REFERENCES public.profiles(id),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create didit_configuration table for admin settings
CREATE TABLE public.didit_configuration (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.didit_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.didit_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.didit_configuration ENABLE ROW LEVEL SECURITY;

-- RLS policies for didit_verifications
CREATE POLICY "Users can view their own verifications" ON public.didit_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications" ON public.didit_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications" ON public.didit_verifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all verifications" ON public.didit_verifications
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS policies for didit_audit_log
CREATE POLICY "Admins can view audit logs" ON public.didit_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert audit logs" ON public.didit_audit_log
  FOR INSERT WITH CHECK (true);

-- RLS policies for didit_configuration
CREATE POLICY "Admins can manage configuration" ON public.didit_configuration
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert default configuration
INSERT INTO public.didit_configuration (setting_key, setting_value, description) VALUES
('verification_timeout', '3600', 'Verification session timeout in seconds'),
('required_confidence_threshold', '0.8', 'Minimum confidence score for verification'),
('enabled_verification_methods', '["document", "liveness"]', 'Array of enabled verification methods'),
('document_types_allowed', '["passport", "drivers_license", "national_id", "voters_id"]', 'Allowed document types for verification'),
('auto_approve_threshold', '0.95', 'Confidence threshold for automatic approval');

-- Create function to log verification status changes
CREATE OR REPLACE FUNCTION public.log_verification_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.didit_audit_log (
    verification_id,
    user_id,
    action,
    old_status,
    new_status,
    metadata
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'status_change',
    OLD.status,
    NEW.status,
    jsonb_build_object(
      'confidence_score', NEW.confidence_score,
      'verification_method', NEW.verification_method,
      'document_type', NEW.document_type
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE TRIGGER didit_verification_audit_trigger
  AFTER UPDATE ON public.didit_verifications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_verification_change();

-- Update profiles table to include didit verification status
ALTER TABLE public.profiles 
ADD COLUMN didit_verification_status verification_result DEFAULT 'pending',
ADD COLUMN didit_verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN didit_confidence_score DECIMAL(3,2);
