-- Migration: Update allowed values for the 'role' column in 'profiles' table
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check,
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'observer', 'roving_observer', 'parish_coordinator')); 