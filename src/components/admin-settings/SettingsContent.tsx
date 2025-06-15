
import React from 'react';
import { UserSettings } from './UserSettings';
import { SecuritySettings } from './SecuritySettings';
import { CommunicationsSettings } from './CommunicationsSettings';
import { NotificationSettings } from './NotificationSettings';
import { DataSettings } from './DataSettings';
import { TwilioSettings } from './TwilioSettings';
import { DiditSettings } from './DiditSettings';
import { SMSAnalytics } from './SMSAnalytics';
import { HereMapsSettings } from './HereMapsSettings';

interface SettingsContentProps {
  activeSection: string;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({ activeSection }) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'communications':
        return <CommunicationsSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'data':
        return <DataSettings />;
      case 'twilio':
        return <TwilioSettings />;
      case 'didit':
        return <DiditSettings />;
      case 'sms-analytics':
        return <SMSAnalytics />;
      case 'here-maps':
        return <HereMapsSettings />;
      default:
        return <UserSettings />;
    }
  };

  return (
    <div className="flex-1 p-6">
      {renderContent()}
    </div>
  );
};
