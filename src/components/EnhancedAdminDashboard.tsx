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
import { EmailInbox } from '@/components/email-inbox/EmailInbox';
import { GoogleSheetsManager } from '@/components/google-sheets/GoogleSheetsManager';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboardData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings } from 'lucide-react';
import { useAuth, useNavigate, useToast } from '@/hooks/useAuth';
import { Users, MapPin, FileText, MessageSquare, Shield, Lock, Activity } from 'lucide-react';

export const EnhancedAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeSection, setActiveSection] = useState('overview');
  
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: recentActivity, isLoading: activityLoading, error: activityError } = useRecentActivity();

  const handleNavigateToManagement = () => {
    setActiveSection('management');
  };

  const handleNavigateToSettings = () => {
    setActiveSection('settings');
  };

  const handleBackToDashboard = () => {
    setActiveSection('overview');
  };

  const renderContent = () => {
    if (statsError || activityError) {
      return (
        <Alert variant="destructive" className="mx-4 sm:mx-0">
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
      case 'inbox':
        return <EmailInbox />;
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
      case 'google-sheets':
        return <GoogleSheetsManager />;
      case 'settings':
        return <SettingsLayout onBackToDashboard={handleBackToDashboard} />;
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
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-0">
          <div>
            {/* Empty div to maintain layout */}
          </div>
          <Button
            onClick={handleNavigateToSettings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Settings className="w-4 h-4" />
            <span className="sm:inline">System Settings</span>
          </Button>
        </div>
      );
    }

    return (
      <div className="mb-4 sm:mb-6 flex flex-col gap-4 px-4 sm:px-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <nav className="flex flex-wrap gap-2 sm:space-x-4 border-b border-gray-200 pb-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveSection('overview')}
              className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
            >
              ← Back to Overview
            </button>
            <button
              onClick={() => setActiveSection('management')}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 whitespace-nowrap"
            >
              Management Center
            </button>
          </nav>
          <Button
            onClick={handleNavigateToSettings}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Settings className="w-4 h-4" />
            <span className="sm:inline">Settings</span>
          </Button>
        </div>
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
        <div className="flex items-center justify-center py-12 px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="px-4 sm:px-0">
          {renderContent()}
        </div>
      )}
    </AdminLayout>
  );
};

const managementOptions = [
  {
    title: "User Management",
    description: "Manage observers, admins, and user verification",
    icon: Users,
    path: "/admin/users",
    color: "bg-blue-500"
  },
  {
    title: "Polling Stations",
    description: "Configure stations and assign observers",
    icon: MapPin,
    path: "/admin/stations",
    color: "bg-green-500"
  },
  {
    title: "Reports & Analytics",
    description: "View reports and system analytics",
    icon: FileText,
    path: "/admin/reports",
    color: "bg-purple-500"
  },
  {
    title: "Communications",
    description: "Manage SMS campaigns and messaging",
    icon: MessageSquare,
    path: "/admin/communications",
    color: "bg-orange-500"
  },
  {
    title: "System Settings",
    description: "Configure system preferences and integrations",
    icon: Settings,
    path: "/admin/settings",
    color: "bg-gray-600"
  },
  {
    title: "Identity Verification",
    description: "Manage Didit integration and verification",
    icon: Shield,
    path: "/admin/verification",
    color: "bg-indigo-500"
  },
  {
    title: "Encryption Management", 
    description: "Military-grade encryption and security controls",
    icon: Lock,
    path: "/admin/encryption",
    color: "bg-red-500"
  },
  {
    title: "System Monitoring",
    description: "Monitor system health and performance",
    icon: Activity,
    path: "/admin/monitoring",
    color: "bg-cyan-500"
  }
];
