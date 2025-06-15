
import React from 'react';
import { DiditSettings } from './DiditSettings';
import { TwilioSettings } from './TwilioSettings';
import { SMSAnalytics } from './SMSAnalytics';
import { SystemSettings } from '../SystemSettings';
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
      case 'communications':
      case 'security':
      case 'data':
      case 'users':
        return (
          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Settings
            </h2>
            <p className="text-gray-600">This section is coming soon...</p>
          </div>
        );
      default:
        return <SystemSettings />;
    }
  };

  return renderContent();
};
