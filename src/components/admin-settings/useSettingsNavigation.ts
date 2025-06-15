
import { useState } from 'react';

export type SettingsSection = 
  | 'general'
  | 'didit'
  | 'twilio'
  | 'sms-analytics'
  | 'notifications'
  | 'communications'
  | 'email-inbox'
  | 'security'
  | 'data'
  | 'users';

export const useSettingsNavigation = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  return {
    activeSection,
    setActiveSection
  };
};
