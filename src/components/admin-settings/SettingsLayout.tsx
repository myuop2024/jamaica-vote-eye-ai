
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { SettingsContent } from './SettingsContent';
import { useSettingsNavigation } from './useSettingsNavigation';

export const SettingsLayout: React.FC = () => {
  const { activeSection, setActiveSection } = useSettingsNavigation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <SidebarInset className="flex-1">
          <div className="p-6">
            <SettingsContent activeSection={activeSection} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
