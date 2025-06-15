
import React, { useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { DashboardOverview } from '@/components/admin-dashboard/DashboardOverview';
import { ManagementNavigation } from '@/components/admin-dashboard/ManagementNavigation';
import { UserManagement } from '@/components/UserManagement';
import { CommunicationsManager } from '@/components/CommunicationsManager';
import { VerificationCenter } from '@/components/VerificationCenter';
import { ReportsManager } from '@/components/ReportsManager';
import { PollingStationsManager } from '@/components/PollingStationsManager';
import { SettingsLayout } from '@/components/admin-settings/SettingsLayout';
import { AdminVerificationManager } from '@/components/identity-verification/AdminVerificationManager';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboardData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';

export const EnhancedAdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState('overview');
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity();

  const handleNavigateToManagement = () => {
    setActiveSection('management');
  };

  const handleNavigateToSettings = () => {
    setActiveSection('settings');
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
      case 'identity-verification':
        return <AdminVerificationManager />;
      case 'reports':
        return <ReportsManager />;
      case 'stations':
        return <PollingStationsManager />;
      case 'settings':
        return <SettingsLayout />;
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
      return (
        <div className="mb-6 flex justify-between items-center">
          <div>
            {/* Empty div to maintain layout */}
          </div>
          <Button
            onClick={handleNavigateToSettings}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            System Settings
          </Button>
        </div>
      );
    }

    return (
      <div className="mb-6 flex justify-between items-center">
        <nav className="flex space-x-4 border-b border-gray-200 pb-2">
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
        <Button
          onClick={handleNavigateToSettings}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>
    );
  };

  // Use different layout for settings to accommodate sidebar
  if (activeSection === 'settings') {
    return (
      <AdminLayout showSidebar={true}>
        {renderContent()}
      </AdminLayout>
    );
  }

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
