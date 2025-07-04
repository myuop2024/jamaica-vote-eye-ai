export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          deleted: boolean
          edited: boolean
          file_name: string | null
          file_url: string | null
          id: string
          receiver_id: string | null
          receiver_name: string | null
          room: string
          sender_id: string
          sender_name: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted?: boolean
          edited?: boolean
          file_name?: string | null
          file_url?: string | null
          id?: string
          receiver_id?: string | null
          receiver_name?: string | null
          room: string
          sender_id: string
          sender_name?: string | null
          type?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted?: boolean
          edited?: boolean
          file_name?: string | null
          file_url?: string | null
          id?: string
          receiver_id?: string | null
          receiver_name?: string | null
          room?: string
          sender_id?: string
          sender_name?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          communication_id: string
          created_at: string
          delivered_at: string | null
          error_message: string | null
          external_id: string | null
          id: string
          message_content: string
          recipient_id: string
          recipient_phone: string
          sent_at: string | null
        }
        Insert: {
          communication_id: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content: string
          recipient_id: string
          recipient_phone: string
          sent_at?: string | null
        }
        Update: {
          communication_id?: string
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          external_id?: string | null
          id?: string
          message_content?: string
          recipient_id?: string
          recipient_phone?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          campaign_name: string
          communication_type: Database["public"]["Enums"]["communication_type"]
          created_at: string
          delivered_count: number | null
          encryption_metadata: Json | null
          failed_count: number | null
          id: string
          message_content: string
          scheduled_at: string | null
          sent_at: string | null
          sent_by: string
          sent_count: number | null
          status: Database["public"]["Enums"]["communication_status"]
          target_audience: string
          target_filter: Json | null
        }
        Insert: {
          campaign_name: string
          communication_type?: Database["public"]["Enums"]["communication_type"]
          created_at?: string
          delivered_count?: number | null
          encryption_metadata?: Json | null
          failed_count?: number | null
          id?: string
          message_content: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by: string
          sent_count?: number | null
          status?: Database["public"]["Enums"]["communication_status"]
          target_audience: string
          target_filter?: Json | null
        }
        Update: {
          campaign_name?: string
          communication_type?: Database["public"]["Enums"]["communication_type"]
          created_at?: string
          delivered_count?: number | null
          encryption_metadata?: Json | null
          failed_count?: number | null
          id?: string
          message_content?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_by?: string
          sent_count?: number | null
          status?: Database["public"]["Enums"]["communication_status"]
          target_audience?: string
          target_filter?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_classification: {
        Row: {
          access_control_policy: Json | null
          audit_requirements: Json | null
          classification_level: string
          column_name: string
          created_at: string
          encryption_required: boolean
          id: string
          retention_period_days: number | null
          table_name: string
        }
        Insert: {
          access_control_policy?: Json | null
          audit_requirements?: Json | null
          classification_level: string
          column_name: string
          created_at?: string
          encryption_required?: boolean
          id?: string
          retention_period_days?: number | null
          table_name: string
        }
        Update: {
          access_control_policy?: Json | null
          audit_requirements?: Json | null
          classification_level?: string
          column_name?: string
          created_at?: string
          encryption_required?: boolean
          id?: string
          retention_period_days?: number | null
          table_name?: string
        }
        Relationships: []
      }
      didit_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_status: Database["public"]["Enums"]["verification_result"] | null
          old_status: Database["public"]["Enums"]["verification_result"] | null
          performed_by: string | null
          user_agent: string | null
          user_id: string | null
          verification_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["verification_result"] | null
          old_status?: Database["public"]["Enums"]["verification_result"] | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string | null
          verification_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["verification_result"] | null
          old_status?: Database["public"]["Enums"]["verification_result"] | null
          performed_by?: string | null
          user_agent?: string | null
          user_id?: string | null
          verification_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "didit_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "didit_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "didit_audit_log_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "didit_verifications"
            referencedColumns: ["id"]
          },
        ]
      }
      didit_configuration: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "didit_configuration_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      didit_verifications: {
        Row: {
          confidence_score: number | null
          created_at: string
          didit_response: Json | null
          didit_session_id: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          encryption_metadata: Json | null
          error_message: string | null
          expires_at: string | null
          extracted_data: Json | null
          id: string
          status: Database["public"]["Enums"]["verification_result"]
          updated_at: string
          user_id: string
          verification_metadata: Json | null
          verification_method: Database["public"]["Enums"]["verification_method"]
          verified_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          didit_response?: Json | null
          didit_session_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          encryption_metadata?: Json | null
          error_message?: string | null
          expires_at?: string | null
          extracted_data?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["verification_result"]
          updated_at?: string
          user_id: string
          verification_metadata?: Json | null
          verification_method: Database["public"]["Enums"]["verification_method"]
          verified_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          didit_response?: Json | null
          didit_session_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"] | null
          encryption_metadata?: Json | null
          error_message?: string | null
          expires_at?: string | null
          extracted_data?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["verification_result"]
          updated_at?: string
          user_id?: string
          verification_metadata?: Json | null
          verification_method?: Database["public"]["Enums"]["verification_method"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "didit_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          email_address: string
          id: string
          is_active: boolean
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email_address: string
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email_address?: string
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_attachments: {
        Row: {
          attachment_id: string | null
          content_url: string | null
          created_at: string
          filename: string
          id: string
          message_id: string
          mime_type: string | null
          size_bytes: number | null
        }
        Insert: {
          attachment_id?: string | null
          content_url?: string | null
          created_at?: string
          filename: string
          id?: string
          message_id: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Update: {
          attachment_id?: string | null
          content_url?: string | null
          created_at?: string
          filename?: string
          id?: string
          message_id?: string
          mime_type?: string | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "email_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          bcc_emails: Json | null
          body_html: string | null
          body_text: string | null
          cc_emails: Json | null
          created_at: string
          email_account_id: string
          from_email: string
          from_name: string | null
          has_attachments: boolean
          id: string
          is_read: boolean
          is_sent: boolean
          labels: Json | null
          message_id: string
          received_at: string | null
          sent_at: string | null
          subject: string | null
          thread_id: string | null
          to_emails: Json
          updated_at: string
        }
        Insert: {
          bcc_emails?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json | null
          created_at?: string
          email_account_id: string
          from_email: string
          from_name?: string | null
          has_attachments?: boolean
          id?: string
          is_read?: boolean
          is_sent?: boolean
          labels?: Json | null
          message_id: string
          received_at?: string | null
          sent_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: Json
          updated_at?: string
        }
        Update: {
          bcc_emails?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json | null
          created_at?: string
          email_account_id?: string
          from_email?: string
          from_name?: string | null
          has_attachments?: boolean
          id?: string
          is_read?: boolean
          is_sent?: boolean
          labels?: Json | null
          message_id?: string
          received_at?: string | null
          sent_at?: string | null
          subject?: string | null
          thread_id?: string | null
          to_emails?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_audit_log: {
        Row: {
          created_at: string
          encryption_algorithm: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          key_version: number | null
          metadata: Json | null
          operation_type: string
          resource_id: string | null
          resource_type: string
          risk_score: number | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          encryption_algorithm?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          key_version?: number | null
          metadata?: Json | null
          operation_type: string
          resource_id?: string | null
          resource_type: string
          risk_score?: number | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          encryption_algorithm?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          key_version?: number | null
          metadata?: Json | null
          operation_type?: string
          resource_id?: string | null
          resource_type?: string
          risk_score?: number | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      encryption_config: {
        Row: {
          algorithm: string
          compliance_level: string
          created_at: string
          expires_at: string | null
          id: string
          key_name: string
          key_status: string
          key_version: number
          metadata: Json | null
        }
        Insert: {
          algorithm?: string
          compliance_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key_name: string
          key_status?: string
          key_version?: number
          metadata?: Json | null
        }
        Update: {
          algorithm?: string
          compliance_level?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          key_name?: string
          key_status?: string
          key_version?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: number
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: number
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      observation_reports: {
        Row: {
          attachments: Json | null
          created_at: string
          encryption_metadata: Json | null
          id: string
          location_data: Json | null
          observer_id: string
          report_text: string
          station_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          encryption_metadata?: Json | null
          id?: string
          location_data?: Json | null
          observer_id: string
          report_text: string
          station_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          encryption_metadata?: Json | null
          id?: string
          location_data?: Json | null
          observer_id?: string
          report_text?: string
          station_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observation_reports_observer_id_fkey"
            columns: ["observer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polling_stations: {
        Row: {
          address: string
          assigned_observers: string[] | null
          constituency: string
          coordinates: Json | null
          created_at: string
          id: string
          parish: string
          station_code: string
          station_name: string
        }
        Insert: {
          address: string
          assigned_observers?: string[] | null
          constituency: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          parish: string
          station_code: string
          station_name: string
        }
        Update: {
          address?: string
          assigned_observers?: string[] | null
          constituency?: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          parish?: string
          station_code?: string
          station_name?: string
        }
        Relationships: []
      }
      profile_field_templates: {
        Row: {
          admin_only: boolean | null
          created_at: string
          default_value: string | null
          field_key: string
          id: number
          label: string
          options: Json | null
          order: number | null
          required: boolean | null
          type: string
          updated_at: string
          validation: string | null
          visible_to_user: boolean | null
        }
        Insert: {
          admin_only?: boolean | null
          created_at?: string
          default_value?: string | null
          field_key: string
          id?: number
          label: string
          options?: Json | null
          order?: number | null
          required?: boolean | null
          type: string
          updated_at?: string
          validation?: string | null
          visible_to_user?: boolean | null
        }
        Update: {
          admin_only?: boolean | null
          created_at?: string
          default_value?: string | null
          field_key?: string
          id?: number
          label?: string
          options?: Json | null
          order?: number | null
          required?: boolean | null
          type?: string
          updated_at?: string
          validation?: string | null
          visible_to_user?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          assigned_station: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank_routing_number: string | null
          created_at: string
          date_of_birth: string | null
          deployment_parish: string | null
          didit_confidence_score: number | null
          didit_verification_date: string | null
          didit_verification_status:
            | Database["public"]["Enums"]["verification_result"]
            | null
          email: string
          encryption_metadata: Json | null
          id: string
          last_login: string | null
          name: string
          parish: string | null
          phone_number: string | null
          profile_data: Json | null
          profile_image: string | null
          role: string
          trn: string | null
          unique_user_id: string | null
          updated_at: string
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          address?: string | null
          assigned_station?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string
          date_of_birth?: string | null
          deployment_parish?: string | null
          didit_confidence_score?: number | null
          didit_verification_date?: string | null
          didit_verification_status?:
            | Database["public"]["Enums"]["verification_result"]
            | null
          email: string
          encryption_metadata?: Json | null
          id: string
          last_login?: string | null
          name: string
          parish?: string | null
          phone_number?: string | null
          profile_data?: Json | null
          profile_image?: string | null
          role: string
          trn?: string | null
          unique_user_id?: string | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          address?: string | null
          assigned_station?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank_routing_number?: string | null
          created_at?: string
          date_of_birth?: string | null
          deployment_parish?: string | null
          didit_confidence_score?: number | null
          didit_verification_date?: string | null
          didit_verification_status?:
            | Database["public"]["Enums"]["verification_result"]
            | null
          email?: string
          encryption_metadata?: Json | null
          id?: string
          last_login?: string | null
          name?: string
          parish?: string | null
          phone_number?: string | null
          profile_data?: Json | null
          profile_image?: string | null
          role?: string
          trn?: string | null
          unique_user_id?: string | null
          updated_at?: string
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      secure_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          encryption_level: string
          expires_at: string
          id: string
          ip_address: unknown | null
          last_activity: string
          mfa_verified: boolean
          risk_assessment: Json | null
          session_token_hash: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          encryption_level?: string
          expires_at: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          mfa_verified?: boolean
          risk_assessment?: Json | null
          session_token_hash: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          encryption_level?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          last_activity?: string
          mfa_verified?: boolean
          risk_assessment?: Json | null
          session_token_hash?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          observer_id: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          observer_id: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          observer_id?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_observer_id_fkey"
            columns: ["observer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_security: {
        Row: {
          allowed_ips: Json | null
          compliance_requirements: Json | null
          created_at: string
          current_key_version: number
          id: string
          key_rotation_interval: number
          mtls_required: boolean
          rate_limit_per_minute: number
          signing_algorithm: string
          updated_at: string
          webhook_name: string
        }
        Insert: {
          allowed_ips?: Json | null
          compliance_requirements?: Json | null
          created_at?: string
          current_key_version?: number
          id?: string
          key_rotation_interval?: number
          mtls_required?: boolean
          rate_limit_per_minute?: number
          signing_algorithm?: string
          updated_at?: string
          webhook_name: string
        }
        Update: {
          allowed_ips?: Json | null
          compliance_requirements?: Json | null
          created_at?: string
          current_key_version?: number
          id?: string
          key_rotation_interval?: number
          mtls_required?: boolean
          rate_limit_per_minute?: number
          signing_algorithm?: string
          updated_at?: string
          webhook_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_cancel_verification: {
        Args: { verification_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      communication_status: "pending" | "sent" | "delivered" | "failed"
      communication_type: "sms" | "whatsapp" | "email"
      document_type:
        | "passport"
        | "drivers_license"
        | "national_id"
        | "voters_id"
        | "birth_certificate"
        | "utility_bill"
        | "bank_statement"
      report_status: "submitted" | "under_review" | "resolved" | "flagged"
      verification_method:
        | "document"
        | "biometric"
        | "liveness"
        | "address"
        | "phone"
        | "email"
      verification_result:
        | "pending"
        | "verified"
        | "failed"
        | "expired"
        | "cancelled"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      communication_status: ["pending", "sent", "delivered", "failed"],
      communication_type: ["sms", "whatsapp", "email"],
      document_type: [
        "passport",
        "drivers_license",
        "national_id",
        "voters_id",
        "birth_certificate",
        "utility_bill",
        "bank_statement",
      ],
      report_status: ["submitted", "under_review", "resolved", "flagged"],
      verification_method: [
        "document",
        "biometric",
        "liveness",
        "address",
        "phone",
        "email",
      ],
      verification_result: [
        "pending",
        "verified",
        "failed",
        "expired",
        "cancelled",
      ],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
