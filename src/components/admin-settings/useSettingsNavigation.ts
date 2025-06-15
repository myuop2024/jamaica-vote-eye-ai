
import { useState } from 'react';

export type SettingsSection = 
  | 'general'
  | 'didit'
  | 'twilio'
  | 'sms-analytics'
  | 'notifications'
  | 'communications'
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
