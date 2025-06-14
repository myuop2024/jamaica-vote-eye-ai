
-- First, create the missing enum types that should exist
DO $$ 
BEGIN
    -- Create verification_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
    END IF;
    
    -- Create other missing enum types if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE public.report_status AS ENUM ('submitted', 'under_review', 'resolved', 'flagged');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_type') THEN
        CREATE TYPE public.communication_type AS ENUM ('sms', 'whatsapp', 'email');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'communication_status') THEN
        CREATE TYPE public.communication_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
    END IF;
END $$;

-- Now update the profiles table to use the correct verification_status type
ALTER TABLE public.profiles 
ALTER COLUMN verification_status TYPE verification_status 
USING verification_status::text::verification_status;

-- Make sure the handle_new_user function works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, verification_status, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'observer'),
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'observer') = 'admin' THEN 'verified'::verification_status
      ELSE 'pending'::verification_status
    END,
    NEW.raw_user_meta_data->>'phone_number'
  );
  RETURN NEW;
END;
$$;
