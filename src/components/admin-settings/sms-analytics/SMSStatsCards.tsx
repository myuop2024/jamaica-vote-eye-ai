
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  BarChart3
} from 'lucide-react';
import { SMSStats } from './types';

interface SMSStatsCardsProps {
  stats: SMSStats;
}

export const SMSStatsCards: React.FC<SMSStatsCardsProps> = ({ stats }) => {
  return (
    <>
      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDelivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Last 24 Hours</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.last24h}</p>
            <p className="text-sm text-gray-600">SMS messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">This Month</h3>
            <p className="text-3xl font-bold text-green-600">{stats.thisMonth}</p>
            <p className="text-sm text-gray-600">SMS messages sent</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
