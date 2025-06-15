
import { useState } from 'react';

export type SettingsSection = 
  | 'general'
  | 'users' 
  | 'security'
  | 'communications'
  | 'notifications'
  | 'data'
  | 'twilio'
  | 'didit'
  | 'sms-analytics'
  | 'here-maps'
  | 'email-inbox';

export const useSettingsNavigation = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  return {
    activeSection,
    setActiveSection
  };
};
