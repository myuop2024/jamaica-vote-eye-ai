
export interface Communication {
  id: string;
  campaign_name: string;
  message_content: string;
  communication_type: 'sms' | 'whatsapp' | 'email';
  target_audience: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  sent_at?: string;
}

export const MESSAGE_TEMPLATES = {
  sms: [
    "Reminder: Please check in at your assigned polling station by 8 AM tomorrow.",
    "Update: Voting has been extended by 1 hour. Please remain at your station.",
    "Important: Report any irregularities immediately through the app."
  ],
  email: [
    "Pre-election briefing scheduled for tomorrow at 2 PM. Location details attached.",
    "Thank you for your service as an electoral observer. Your dedication helps ensure fair elections.",
    "Monthly report submission is due by the 5th. Please submit through the portal."
  ],
  whatsapp: [
    "Quick check-in: How are things at your polling station? Reply with status update.",
    "Emergency contact activated. Please respond if you need immediate assistance.",
    "End of day report: Please submit your observations within the next hour."
  ]
};
