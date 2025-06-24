import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Settings, Shield, Database, Bell, Mail, Users, Key, Phone, BarChart3, Inbox, MapPin } from 'lucide-react';
import { SettingsSection } from './useSettingsNavigation';

interface AdminSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const settingsSections = [
  {
    id: 'general' as const,
    label: 'General Settings',
    icon: Settings,
    description: 'System configuration'
  },
  {
    id: 'users' as const,
    label: 'User Settings',
    icon: Users,
    description: 'User preferences'
  },
  {
    id: 'didit' as const,
    label: 'Didit Verification Settings',
    icon: Shield,
    description: 'Configure Didit integration'
  },
  {
    id: 'twilio' as const,
    label: 'Twilio SMS Settings',
    icon: Phone,
    description: 'Configure SMS provider'
  },
  {
    id: 'here-maps' as const,
    label: 'HERE Maps Settings',
    icon: MapPin,
    description: 'Address & location services'
  },
  {
    id: 'sms-analytics' as const,
    label: 'SMS Analytics',
    icon: BarChart3,
    description: 'View SMS logs & stats'
  },
  {
    id: 'notifications' as const,
    label: 'Notifications Settings',
    icon: Bell,
    description: 'Configure email & SMS alerts'
  },
  {
    id: 'communications' as const,
    label: 'Communications Settings',
    icon: Mail,
    description: 'Provider and campaign settings'
  },
  {
    id: 'email-inbox' as const,
    label: 'Email Inbox Settings',
    icon: Inbox,
    description: 'Email provider/configuration'
  },
  {
    id: 'security' as const,
    label: 'Security Settings',
    icon: Key,
    description: 'Authentication & security'
  },
  {
    id: 'data' as const,
    label: 'Data Management',
    icon: Database,
    description: 'Backup & retention policies'
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-yellow-500 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Settings</h2>
            <p className="text-sm text-gray-600">Configure preferences</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2 py-2">
            Configuration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsSections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    isActive={activeSection === section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={`w-full p-3 rounded-lg transition-all duration-200 ${
                      activeSection === section.id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <section.icon className={`w-4 h-4 flex-shrink-0 ${
                        activeSection === section.id ? 'text-green-600' : 'text-gray-500'
                      }`} />
                      <div className="flex flex-col items-start min-w-0 flex-1">
                        <span className="font-medium text-sm truncate w-full text-left">
                          {section.label}
                        </span>
                        <span className="text-xs text-gray-500 truncate w-full text-left">
                          {section.description}
                        </span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Auto-save enabled</p>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
