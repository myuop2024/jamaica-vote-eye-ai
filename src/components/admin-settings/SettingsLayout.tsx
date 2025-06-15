
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { SettingsContent } from './SettingsContent';
import { useSettingsNavigation } from './useSettingsNavigation';

interface SettingsLayoutProps {
  onBackToDashboard?: () => void;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ onBackToDashboard }) => {
  const { activeSection, setActiveSection } = useSettingsNavigation();

  const handleBackToDashboard = () => {
    if (onBackToDashboard) {
      onBackToDashboard();
    } else {
      // Fallback to browser history
      window.history.back();
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
          <div className="border-b bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToDashboard}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <h1 className="text-lg font-semibold text-gray-900">System Settings</h1>
              </div>
            </div>
          </div>
          <div className="p-6">
            <SettingsContent activeSection={activeSection} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
