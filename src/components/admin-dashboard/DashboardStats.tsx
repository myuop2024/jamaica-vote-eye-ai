
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, Clock, AlertTriangle, LucideIcon } from 'lucide-react';

interface DashboardStats {
  totalObservers: number;
  verified: number;
  pending: number;
  flagged: number;
  totalReports: number;
}

interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

interface DashboardStatsProps {
  stats: DashboardStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const statCards: StatCard[] = [
    { 
      label: 'Total Observers', 
      value: stats.totalObservers.toString(), 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Verified', 
      value: stats.verified.toString(), 
      icon: CheckCircle, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Pending', 
      value: stats.pending.toString(), 
      icon: Clock, 
      color: 'bg-yellow-500' 
    },
    { 
      label: 'Flagged', 
      value: stats.flagged.toString(), 
      icon: AlertTriangle, 
      color: 'bg-red-500' 
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {statCards.map((stat, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.label}</p>
                <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-2 sm:p-3 rounded-lg flex-shrink-0`}>
                <stat.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
