
-- Update the handle_new_user function to work with the new signup flow
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, verification_status, phone_number, assigned_station)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'observer'),
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'observer') = 'admin' THEN 'verified'::verification_status
      ELSE 'pending'::verification_status
    END,
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'assigned_station'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RAISE;
END;
$function$;
