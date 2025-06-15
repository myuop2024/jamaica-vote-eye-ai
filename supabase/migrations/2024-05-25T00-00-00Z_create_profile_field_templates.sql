-- Create table for dynamic profile field templates
CREATE TABLE IF NOT EXISTS profile_field_templates (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  field_key TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'text', 'number', 'date', 'select', 'checkbox', 'file', etc.
  options JSONB,
  required BOOLEAN DEFAULT FALSE,
  validation TEXT,
  order INTEGER DEFAULT 0,
  default_value TEXT,
  visible_to_user BOOLEAN DEFAULT TRUE,
  admin_only BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add profile_data column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_data JSONB DEFAULT '{}'; 