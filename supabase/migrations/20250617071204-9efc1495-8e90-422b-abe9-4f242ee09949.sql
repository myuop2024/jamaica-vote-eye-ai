
-- Add deployment_parish column to profiles table if it doesn't exist
-- This separates the user's deployment parish (for assignment/sorting) 
-- from their address parish (for location validation)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'deployment_parish'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN deployment_parish text;
        
        -- Create index for performance when filtering/sorting by deployment parish
        CREATE INDEX profiles_deployment_parish_idx ON public.profiles (deployment_parish);
        
        -- Update existing records to copy parish to deployment_parish as a starting point
        -- Admins can then update deployment parishes as needed
        UPDATE public.profiles 
        SET deployment_parish = parish 
        WHERE parish IS NOT NULL AND deployment_parish IS NULL;
    END IF;
END $$;
