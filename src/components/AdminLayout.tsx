
import React from 'react';
import { AdminDashboardHeader } from '@/components/admin-dashboard/AdminDashboardHeader';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader 
        userName={user?.name}
        onLogout={logout}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};
