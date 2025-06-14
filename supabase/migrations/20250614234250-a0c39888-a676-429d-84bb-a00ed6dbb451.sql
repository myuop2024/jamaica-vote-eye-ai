
-- First, drop everything cleanly to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop and recreate all enum types to ensure they exist properly
DROP TYPE IF EXISTS public.verification_status CASCADE;
DROP TYPE IF EXISTS public.report_status CASCADE;
DROP TYPE IF EXISTS public.communication_type CASCADE;
DROP TYPE IF EXISTS public.communication_status CASCADE;

-- Create all enum types
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.report_status AS ENUM ('submitted', 'under_review', 'resolved', 'flagged');
CREATE TYPE public.communication_type AS ENUM ('sms', 'whatsapp', 'email');
CREATE TYPE public.communication_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- Ensure the profiles table has the correct column type
DO $$
BEGIN
    -- Check if verification_status column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'verification_status' 
        AND table_schema = 'public'
    ) THEN
        -- If it exists, alter its type to use the enum
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status TYPE verification_status 
        USING COALESCE(verification_status::text::verification_status, 'pending'::verification_status);
        
        -- Set default value
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status SET DEFAULT 'pending'::verification_status;
    ELSE
        -- If it doesn't exist, add it
        ALTER TABLE public.profiles 
        ADD COLUMN verification_status verification_status DEFAULT 'pending'::verification_status;
    END IF;
END $$;

-- Recreate the handle_new_user function with proper error handling
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
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
