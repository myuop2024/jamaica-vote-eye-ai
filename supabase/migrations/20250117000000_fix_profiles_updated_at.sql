-- Add missing updated_at column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Add missing fields to profiles table that are referenced in the code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parish TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deployment_parish TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_routing_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trn TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}';

-- Create the profile_field_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profile_field_templates (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  field_key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'checkbox', 'file', etc.
  options JSONB,
  required BOOLEAN DEFAULT FALSE,
  validation TEXT,
  "order" INTEGER DEFAULT 0,
  default_value TEXT,
  visible_to_user BOOLEAN DEFAULT TRUE,
  admin_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profile_field_templates
ALTER TABLE public.profile_field_templates ENABLE ROW LEVEL SECURITY;

-- Ensure get_user_role function exists
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
  RETURN v_role;
END;
$$;

-- Create RLS policies for profile_field_templates (admin only)
CREATE POLICY "Admins can manage profile field templates" 
  ON public.profile_field_templates 
  FOR ALL 
  USING (public.get_user_role(auth.uid()) = 'admin');

-- Create policy for users to read profile field templates
CREATE POLICY "Users can view profile field templates" 
  ON public.profile_field_templates 
  FOR SELECT 
  TO authenticated
  USING (visible_to_user = true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to automatically update updated_at on profile_field_templates
CREATE TRIGGER update_profile_field_templates_updated_at 
  BEFORE UPDATE ON public.profile_field_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default profile field templates
INSERT INTO public.profile_field_templates (label, field_key, type, required, visible_to_user, admin_only, "order") VALUES
  ('Full Name', 'full_name', 'text', true, true, false, 1),
  ('Phone Number', 'phone_number', 'text', false, true, false, 2),
  ('Address', 'address', 'text', false, true, false, 3),
  ('Parish', 'parish', 'select', false, true, false, 4),
  ('Deployment Parish', 'deployment_parish', 'select', false, true, false, 5),
  ('Assigned Station', 'assigned_station', 'text', false, true, false, 6),
  ('Bank Name', 'bank_name', 'text', false, true, false, 7),
  ('Bank Account Number', 'bank_account_number', 'text', false, true, false, 8),
  ('Bank Routing Number', 'bank_routing_number', 'text', false, true, false, 9),
  ('TRN', 'trn', 'text', false, true, false, 10)
ON CONFLICT (field_key) DO NOTHING;

-- Update the parish fields with options
UPDATE public.profile_field_templates 
SET options = '[
  "Clarendon",
  "Hanover",
  "Kingston",
  "Manchester",
  "Portland",
  "Saint Andrew",
  "Saint Ann",
  "Saint Catherine",
  "Saint Elizabeth",
  "Saint James",
  "Saint Mary",
  "Saint Thomas",
  "Trelawny",
  "Westmoreland"
]'::jsonb
WHERE field_key IN ('parish', 'deployment_parish');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);
CREATE INDEX IF NOT EXISTS idx_profile_field_templates_order ON public.profile_field_templates("order");
CREATE INDEX IF NOT EXISTS idx_profile_field_templates_visible ON public.profile_field_templates(visible_to_user); 