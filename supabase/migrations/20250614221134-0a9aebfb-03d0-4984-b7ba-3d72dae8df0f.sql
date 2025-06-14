
-- Check if the constraint already exists before adding it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_email_unique' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
    END IF;
END $$;

-- Insert sample polling stations first (these don't depend on users)
INSERT INTO public.polling_stations (
  station_code,
  station_name,
  constituency,
  parish,
  address,
  coordinates,
  created_at
) VALUES 
(
  'ST001',
  'Kingston Primary School',
  'Kingston Central',
  'Kingston',
  '123 Main Street, Kingston',
  '{"lat": 17.9712, "lng": -76.7936}',
  now()
),
(
  'ST002',
  'Spanish Town Community Center',
  'St. Catherine South',
  'St. Catherine',
  '456 Central Avenue, Spanish Town',
  '{"lat": 17.9909, "lng": -76.9574}',
  now()
),
(
  'ST003',
  'Montego Bay High School',
  'St. James West',
  'St. James',
  '789 Bay Street, Montego Bay',
  '{"lat": 18.4762, "lng": -77.8937}',
  now()
)
ON CONFLICT (station_code) DO NOTHING;

-- Update the handle_new_user function to support setting admin role and verification status
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
