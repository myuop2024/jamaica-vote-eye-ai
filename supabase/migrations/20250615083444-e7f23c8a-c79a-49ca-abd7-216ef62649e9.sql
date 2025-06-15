
-- Create system_settings table for storing configuration values
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage system settings
CREATE POLICY "Admins can manage system settings" 
  ON public.system_settings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Insert initial HERE Maps configuration if it doesn't exist
INSERT INTO public.system_settings (key, value, description)
VALUES (
  'here_maps_config',
  '{"apiKey": "", "isConfigured": false}',
  'HERE Maps API configuration'
) ON CONFLICT (key) DO NOTHING;
