
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Communication } from './types';

interface CommunicationAnalyticsProps {
  communications: Communication[];
}

export const CommunicationAnalytics: React.FC<CommunicationAnalyticsProps> = ({ communications }) => {
  const totalMessages = communications.reduce((sum, comm) => sum + comm.sent_count, 0);
  const totalSent = communications.reduce((sum, comm) => sum + comm.sent_count, 0);
  const totalFailed = communications.reduce((sum, comm) => sum + comm.failed_count, 0);
  const successRate = totalSent + totalFailed > 0 
    ? Math.round((totalSent / (totalSent + totalFailed)) * 100)
    : 0;
  const activeCampaigns = communications.filter(comm => comm.status === 'sent').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {totalMessages}
          </div>
          <p className="text-sm text-gray-600">All time</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {successRate}%
          </div>
          <p className="text-sm text-gray-600">Delivery rate</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {activeCampaigns}
          </div>
          <p className="text-sm text-gray-600">Currently running</p>
        </CardContent>
      </Card>
    </div>
  );
};
