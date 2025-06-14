
-- Create enum types for better data integrity
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.report_status AS ENUM ('submitted', 'under_review', 'resolved', 'flagged');
CREATE TYPE public.communication_type AS ENUM ('sms', 'whatsapp', 'email');
CREATE TYPE public.communication_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'observer')),
  verification_status verification_status NOT NULL DEFAULT 'pending',
  profile_image TEXT,
  phone_number TEXT,
  assigned_station TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  PRIMARY KEY (id)
);

-- Create observation reports table
CREATE TABLE public.observation_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  observer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  station_id TEXT,
  report_text TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'submitted',
  attachments JSONB DEFAULT '[]',
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create communications table for SMS/WhatsApp campaigns
CREATE TABLE public.communications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  message_content TEXT NOT NULL,
  communication_type communication_type NOT NULL,
  target_audience TEXT NOT NULL, -- 'all', 'verified', 'pending', 'specific_stations'
  target_filter JSONB, -- Additional filtering criteria
  status communication_status NOT NULL DEFAULT 'pending',
  sent_by UUID REFERENCES public.profiles(id) NOT NULL,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Create communication logs table for individual message tracking
CREATE TABLE public.communication_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_id UUID REFERENCES public.communications(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  status communication_status NOT NULL DEFAULT 'pending',
  external_id TEXT, -- For tracking with Twilio/WhatsApp
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verification documents table
CREATE TABLE public.verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  observer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL, -- 'id_card', 'training_certificate', 'authorization_letter'
  document_url TEXT NOT NULL,
  verified_by UUID REFERENCES public.profiles(id),
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create stations table for polling station management
CREATE TABLE public.polling_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_code TEXT NOT NULL UNIQUE,
  station_name TEXT NOT NULL,
  constituency TEXT NOT NULL,
  parish TEXT NOT NULL,
  address TEXT NOT NULL,
  coordinates JSONB, -- {lat, lng}
  assigned_observers UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polling_stations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for observation reports
CREATE POLICY "Observers can view their own reports"
  ON public.observation_reports FOR SELECT
  USING (observer_id = auth.uid());

CREATE POLICY "Observers can create their own reports"
  ON public.observation_reports FOR INSERT
  WITH CHECK (observer_id = auth.uid());

CREATE POLICY "Observers can update their own reports"
  ON public.observation_reports FOR UPDATE
  USING (observer_id = auth.uid());

CREATE POLICY "Admins can view all reports"
  ON public.observation_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for communications (admin only)
CREATE POLICY "Admins can manage all communications"
  ON public.communications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all communication logs"
  ON public.communication_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own communication logs"
  ON public.communication_logs FOR SELECT
  USING (recipient_id = auth.uid());

-- Create RLS policies for verification documents
CREATE POLICY "Users can view their own documents"
  ON public.verification_documents FOR SELECT
  USING (observer_id = auth.uid());

CREATE POLICY "Users can upload their own documents"
  ON public.verification_documents FOR INSERT
  WITH CHECK (observer_id = auth.uid());

CREATE POLICY "Admins can manage all documents"
  ON public.verification_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for polling stations
CREATE POLICY "Anyone can view polling stations"
  ON public.polling_stations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage polling stations"
  ON public.polling_stations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'observer')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX idx_observation_reports_observer_id ON public.observation_reports(observer_id);
CREATE INDEX idx_observation_reports_status ON public.observation_reports(status);
CREATE INDEX idx_observation_reports_created_at ON public.observation_reports(created_at);
CREATE INDEX idx_communications_status ON public.communications(status);
CREATE INDEX idx_communication_logs_communication_id ON public.communication_logs(communication_id);
CREATE INDEX idx_communication_logs_recipient_id ON public.communication_logs(recipient_id);
CREATE INDEX idx_verification_documents_observer_id ON public.verification_documents(observer_id);
CREATE INDEX idx_polling_stations_constituency ON public.polling_stations(constituency);
