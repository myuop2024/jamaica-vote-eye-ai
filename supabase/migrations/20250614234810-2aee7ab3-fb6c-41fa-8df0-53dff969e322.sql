
-- Update the handle_new_user function to include 'public' in its search_path
-- This is necessary for the function to find the 'verification_status' enum type.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
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
