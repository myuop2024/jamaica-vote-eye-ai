
-- Add missing columns to communications table
ALTER TABLE public.communications 
ADD COLUMN communication_type communication_type NOT NULL DEFAULT 'sms',
ADD COLUMN status communication_status NOT NULL DEFAULT 'pending';

-- Add missing status column to observation_reports table  
ALTER TABLE public.observation_reports
ADD COLUMN status report_status NOT NULL DEFAULT 'submitted';
