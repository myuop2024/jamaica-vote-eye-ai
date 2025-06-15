
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EncryptionDashboard } from '@/components/encryption/EncryptionDashboard';
import { Navigate } from 'react-router-dom';

const EncryptionManagement: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EncryptionDashboard />
      </div>
    </div>
  );
};

export default EncryptionManagement;
