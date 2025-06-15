
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { Communication } from './types';

interface CampaignHistoryProps {
  communications: Communication[];
}

export const CampaignHistory: React.FC<CampaignHistoryProps> = ({ communications }) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Smartphone className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Campaigns</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {communications.map((comm) => (
            <div key={comm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {getTypeIcon(comm.communication_type)}
                <div>
                  <div className="font-medium">{comm.campaign_name}</div>
                  <div className="text-sm text-gray-500 truncate max-w-[300px]">
                    {comm.message_content}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(comm.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusBadge(comm.status)}>
                  {comm.status}
                </Badge>
                <div className="text-sm text-gray-600">
                  {comm.sent_count} sent
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
