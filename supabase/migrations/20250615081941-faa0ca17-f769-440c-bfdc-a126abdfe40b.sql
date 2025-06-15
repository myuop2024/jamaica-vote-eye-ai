
-- Add new columns to the profiles table for enhanced user information
ALTER TABLE public.profiles 
ADD COLUMN parish TEXT,
ADD COLUMN address TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN bank_account_number TEXT,
ADD COLUMN bank_routing_number TEXT,
ADD COLUMN trn TEXT;

-- Create an index on TRN for faster lookups (TRNs are commonly searched)
CREATE INDEX idx_profiles_trn ON public.profiles(trn);

-- Create an index on parish for filtering purposes
CREATE INDEX idx_profiles_parish ON public.profiles(parish);
