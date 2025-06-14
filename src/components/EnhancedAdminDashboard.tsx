
import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DashboardOverview } from '@/components/admin-dashboard/DashboardOverview';
import { ManagementNavigation } from '@/components/admin-dashboard/ManagementNavigation';
import { UserManagement } from '@/components/UserManagement';
import { CommunicationsManager } from '@/components/CommunicationsManager';
import { VerificationCenter } from '@/components/VerificationCenter';
import { ReportsManager } from '@/components/ReportsManager';
import { PollingStationsManager } from '@/components/PollingStationsManager';
import { SystemSettings } from '@/components/SystemSettings';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboardData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export const EnhancedAdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity();

  const handleNavigateToManagement = () => {
    setActiveSection('management');
  };

  const renderContent = () => {
    if (statsError || activityError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    }

    switch (activeSection) {
      case 'overview':
        return (
          <DashboardOverview
            stats={stats || { totalObservers: 0, verified: 0, pending: 0, flagged: 0, totalReports: 0 }}
            recentActivity={recentActivity || []}
            onNavigateToManagement={handleNavigateToManagement}
          />
        );
      case 'management':
        return (
          <ManagementNavigation
            activeSection=""
            onSectionChange={setActiveSection}
          />
        );
      case 'users':
        return <UserManagement />;
      case 'communications':
        return <CommunicationsManager />;
      case 'verification':
        return <VerificationCenter />;
      case 'reports':
        return <ReportsManager />;
      case 'stations':
        return <PollingStationsManager />;
      case 'settings':
        return <SystemSettings />;
      default:
        return (
          <DashboardOverview
            stats={stats || { totalObservers: 0, verified: 0, pending: 0, flagged: 0, totalReports: 0 }}
            recentActivity={recentActivity || []}
            onNavigateToManagement={handleNavigateToManagement}
          />
        );
    }
  };

  const renderNavigation = () => {
    if (activeSection === 'overview' || activeSection === 'management') {
      return null;
    }

    return (
      <div className="mb-6">
        <nav className="flex space-x-4 border-b border-gray-200">
          <button
            onClick={() => setActiveSection('overview')}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            ← Back to Overview
          </button>
          <button
            onClick={() => setActiveSection('management')}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
          >
            Management Center
          </button>
        </nav>
      </div>
    );
  };

  return (
    <AdminLayout>
      {renderNavigation()}
      {statsLoading || activityLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        renderContent()
      )}
    </AdminLayout>
  );
};
