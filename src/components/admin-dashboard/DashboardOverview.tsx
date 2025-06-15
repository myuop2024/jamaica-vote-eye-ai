
import React from 'react';
import { DashboardStats } from './DashboardStats';
import { QuickActions } from './QuickActions';
import { RecentActivity } from './RecentActivity';

interface DashboardStats {
  totalObservers: number;
  verified: number;
  pending: number;
  flagged: number;
  totalReports: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'user' | 'report' | 'verification' | 'communication';
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  onNavigateToManagement: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  stats,
  recentActivity,
  onNavigateToManagement
}) => {
  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardStats stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-1">
          <QuickActions onNavigateToManagement={onNavigateToManagement} />
        </div>
        <div className="lg:col-span-2">
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
    </div>
  );
};
