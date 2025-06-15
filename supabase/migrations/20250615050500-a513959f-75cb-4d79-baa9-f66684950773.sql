
-- Create table for storing connected email accounts
CREATE TABLE public.email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email_address TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'gmail',
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email_address)
);

-- Create table for storing email messages
CREATE TABLE public.email_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_account_id UUID REFERENCES public.email_accounts(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL, -- Gmail message ID
  thread_id TEXT,
  subject TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails JSONB NOT NULL DEFAULT '[]',
  cc_emails JSONB DEFAULT '[]',
  bcc_emails JSONB DEFAULT '[]',
  body_text TEXT,
  body_html TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  labels JSONB DEFAULT '[]',
  received_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email_account_id, message_id)
);

-- Create table for email attachments
CREATE TABLE public.email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.email_messages(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  attachment_id TEXT, -- Gmail attachment ID
  content_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all email tables
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_accounts
CREATE POLICY "Users can view their own email accounts" 
  ON public.email_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own email accounts" 
  ON public.email_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts" 
  ON public.email_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email accounts" 
  ON public.email_accounts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS policies for email_messages
CREATE POLICY "Users can view messages from their email accounts" 
  ON public.email_messages 
  FOR SELECT 
  USING (email_account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create messages for their email accounts" 
  ON public.email_messages 
  FOR INSERT 
  WITH CHECK (email_account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update messages from their email accounts" 
  ON public.email_messages 
  FOR UPDATE 
  USING (email_account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages from their email accounts" 
  ON public.email_messages 
  FOR DELETE 
  USING (email_account_id IN (
    SELECT id FROM public.email_accounts WHERE user_id = auth.uid()
  ));

-- RLS policies for email_attachments
CREATE POLICY "Users can view attachments from their messages" 
  ON public.email_attachments 
  FOR SELECT 
  USING (message_id IN (
    SELECT em.id FROM public.email_messages em
    JOIN public.email_accounts ea ON em.email_account_id = ea.id
    WHERE ea.user_id = auth.uid()
  ));

CREATE POLICY "Users can create attachments for their messages" 
  ON public.email_attachments 
  FOR INSERT 
  WITH CHECK (message_id IN (
    SELECT em.id FROM public.email_messages em
    JOIN public.email_accounts ea ON em.email_account_id = ea.id
    WHERE ea.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_email_accounts_user_id ON public.email_accounts(user_id);
CREATE INDEX idx_email_messages_account_id ON public.email_messages(email_account_id);
CREATE INDEX idx_email_messages_received_at ON public.email_messages(received_at DESC);
CREATE INDEX idx_email_messages_is_read ON public.email_messages(is_read);
CREATE INDEX idx_email_attachments_message_id ON public.email_attachments(message_id);
