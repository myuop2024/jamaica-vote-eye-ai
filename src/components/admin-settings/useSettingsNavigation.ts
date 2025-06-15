
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

export const useSettingsNavigation = (initialSection: SettingsSection = 'general') => {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);

  return {
    activeSection,
    setActiveSection,
  };
};
