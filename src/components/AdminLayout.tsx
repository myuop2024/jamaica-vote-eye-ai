
import React from 'react';
import { AdminDashboardHeader } from '@/components/admin-dashboard/AdminDashboardHeader';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, showSidebar = false }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader 
        userName={user?.name}
        onLogout={logout}
      />
      <main className={showSidebar ? "h-full" : "max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8"}>
        {children}
      </main>
    </div>
  );
};
