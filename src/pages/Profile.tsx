import React from 'react';
import { ProfileForm } from '@/components/user/ProfileForm';

// TODO: Replace with real user ID from auth context
const userId = 'USER_ID_PLACEHOLDER';

const ProfilePage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <ProfileForm userId={userId} />
    </div>
  );
};

export default ProfilePage; 