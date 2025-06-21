-- Add date_of_birth and unique_user_id columns to the profiles table

-- Add date_of_birth column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add unique_user_id column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS unique_user_id TEXT;

-- Add constraint for unique_user_id length (6 characters)
-- Making it flexible to allow alphanumeric later if needed.
-- A simple text length check for now.
ALTER TABLE public.profiles
ADD CONSTRAINT check_unique_user_id_length CHECK (length(unique_user_id) = 6);

-- Add unique constraint to unique_user_id
-- This needs to be done after the column might have been populated if it's run on existing data.
-- For a new setup, it's fine. If there's a risk of duplicate empty/null values,
-- we might need a more complex partial unique index or handle it in the generation logic.
-- Given it will be populated upon user creation, a simple unique constraint should work.
-- Supabase might also require a different syntax or handle this through its UI/CLI when applying.
-- Let's try adding the constraint directly. If it causes issues with NULLs, we'll revisit.
-- A common practice is to make it NOT NULL if it's truly always required.
-- However, since it's generated *after* user creation, it might be briefly NULL.

-- First, attempt to add the unique constraint.
-- If this fails due to existing NULLs (on a dev instance with old data),
-- one might first populate existing users or accept that NULLs are not considered equal by UNIQUE.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conname = 'profiles_unique_user_id_key'
        AND    conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_unique_user_id_key UNIQUE (unique_user_id);
    END IF;
END;
$$;

-- Add an index for faster lookups on unique_user_id
CREATE INDEX IF NOT EXISTS idx_profiles_unique_user_id ON public.profiles(unique_user_id);

-- Add an index for date_of_birth if it's expected to be queried often
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth ON public.profiles(date_of_birth);

COMMENT ON COLUMN public.profiles.date_of_birth IS 'User''s date of birth.';
COMMENT ON COLUMN public.profiles.unique_user_id IS 'A unique 6-character alphanumeric ID assigned to each user.';
