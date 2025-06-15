
import React from 'react';
import { DiditSettings } from './DiditSettings';
import { TwilioSettings } from './TwilioSettings';
import { SMSAnalytics } from './SMSAnalytics';
import { SystemSettings } from '../SystemSettings';
import { NotificationSettings } from './NotificationSettings';
import { CommunicationsSettings } from './CommunicationsSettings';
import { SecuritySettings } from './SecuritySettings';
import { DataSettings } from './DataSettings';
import { UserSettings } from './UserSettings';
import { SettingsSection } from './useSettingsNavigation';

interface SettingsContentProps {
  activeSection: SettingsSection;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({ activeSection }) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <SystemSettings />;
      case 'didit':
        return <DiditSettings />;
      case 'twilio':
        return <TwilioSettings />;
      case 'sms-analytics':
        return <SMSAnalytics />;
      case 'notifications':
        return <NotificationSettings />;
      case 'communications':
        return <CommunicationsSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'data':
        return <DataSettings />;
      case 'users':
        return <UserSettings />;
      default:
        return <SystemSettings />;
    }
  };

  return renderContent();
};
