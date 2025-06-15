import React from 'react';
import { ProfileForm } from '@/components/user/ProfileForm';
import { useAuth } from '@/contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your profile.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <ProfileForm userId={user.id} />
    </div>
  );
};

export default ProfilePage; 