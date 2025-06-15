
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'user' | 'report' | 'verification' | 'communication';
}

interface RecentActivityProps {
  activities: RecentActivity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <CardDescription className="text-sm">Latest system events and user actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div key={index} className="flex items-start sm:items-center space-x-3 sm:space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 mt-1 sm:mt-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5 break-words">{activity.user}</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <Badge variant="outline" className="text-xs whitespace-nowrap">
                    {activity.time}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
