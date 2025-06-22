
-- Add the missing columns to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS unique_user_id TEXT;

-- Add a unique constraint on unique_user_id (excluding NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_unique_user_id_key 
ON public.profiles(unique_user_id) 
WHERE unique_user_id IS NOT NULL;

-- Add a check constraint for unique_user_id length (using DO block to handle IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_unique_user_id_length'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT check_unique_user_id_length 
        CHECK (unique_user_id IS NULL OR length(unique_user_id) = 6);
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON public.profiles(date_of_birth);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.date_of_birth IS 'User''s date of birth';
COMMENT ON COLUMN public.profiles.unique_user_id IS 'A unique 6-character alphanumeric ID assigned to each user';
