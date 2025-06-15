
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { IdentityVerificationCenter } from '@/components/identity-verification/IdentityVerificationCenter';
import { Navigate } from 'react-router-dom';

const IdentityVerification: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IdentityVerificationCenter />
      </div>
    </div>
  );
};

export default IdentityVerification;
