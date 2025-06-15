
export interface SMSLog {
  id: string;
  recipient_phone: string;
  message_content: string;
  external_id: string;
  sent_at: string;
  delivered_at?: string;
  error_message?: string;
  communication_id: string;
  campaign_name?: string;
  created_at: string;
}

export interface SMSStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  last24h: number;
  thisMonth: number;
}
