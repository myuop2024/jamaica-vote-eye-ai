
-- Ensure all required enum types exist
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

-- Ensure the profiles table has the correct verification_status column type
DO $$
BEGIN
    -- Check if the column exists and update its type if necessary
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'profiles' 
               AND column_name = 'verification_status' 
               AND table_schema = 'public') THEN
        -- Update the column type to use the enum
        ALTER TABLE public.profiles 
        ALTER COLUMN verification_status TYPE verification_status 
        USING verification_status::text::verification_status;
    ELSE
        -- Add the column if it doesn't exist
        ALTER TABLE public.profiles 
        ADD COLUMN verification_status verification_status DEFAULT 'pending'::verification_status;
    END IF;
END $$;

-- Recreate the handle_new_user function to ensure it works correctly
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

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
