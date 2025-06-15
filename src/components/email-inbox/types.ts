
export interface EmailAccount {
  id: string;
  user_id: string;
  email_address: string;
  provider: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  email_account_id: string;
  message_id: string;
  thread_id?: string;
  subject?: string;
  from_email: string;
  from_name?: string;
  to_emails: string[] | any;
  cc_emails?: string[] | any;
  bcc_emails?: string[] | any;
  body_text?: string;
  body_html?: string;
  is_read: boolean;
  is_sent: boolean;
  has_attachments: boolean;
  labels?: string[] | any;
  received_at?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
  email_accounts?: {
    email_address: string;
  };
}

export interface EmailAttachment {
  id: string;
  message_id: string;
  filename: string;
  mime_type?: string;
  size_bytes?: number;
  attachment_id?: string;
  content_url?: string;
  created_at: string;
}
