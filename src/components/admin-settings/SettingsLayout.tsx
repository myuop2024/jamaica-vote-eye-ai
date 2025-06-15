
import React, { useState } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { DiditSettings } from './DiditSettings';
import { SystemSettings } from '../SystemSettings';

export const SettingsLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState('general');

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return <SystemSettings />;
      case 'didit':
        return <DiditSettings />;
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <SidebarInset className="flex-1">
          <div className="p-6">
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
