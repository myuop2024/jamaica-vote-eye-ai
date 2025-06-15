
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
import { Settings, Shield, Database, Bell, Mail, Users, Key, Phone, BarChart3, Inbox } from 'lucide-react';
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
    description: 'System configuration and preferences'
  },
  {
    id: 'didit' as const,
    label: 'Didit Verification',
    icon: Shield,
    description: 'Identity verification settings'
  },
  {
    id: 'twilio' as const,
    label: 'Twilio SMS',
    icon: Phone,
    description: 'SMS service configuration'
  },
  {
    id: 'sms-analytics' as const,
    label: 'SMS Analytics',
    icon: BarChart3,
    description: 'SMS logs and statistics'
  },
  {
    id: 'notifications' as const,
    label: 'Notifications',
    icon: Bell,
    description: 'Email and SMS notification settings'
  },
  {
    id: 'communications' as const,
    label: 'Communications',
    icon: Mail,
    description: 'Email and SMS provider settings'
  },
  {
    id: 'email-inbox' as const,
    label: 'Email Inbox',
    icon: Inbox,
    description: 'Manage email accounts and messages'
  },
  {
    id: 'security' as const,
    label: 'Security',
    icon: Key,
    description: 'Authentication and security settings'
  },
  {
    id: 'data' as const,
    label: 'Data Management',
    icon: Database,
    description: 'Backup and data retention settings'
  },
  {
    id: 'users' as const,
    label: 'User Settings',
    icon: Users,
    description: 'Default user preferences'
  }
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSectionChange
}) => {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Settings
        </h2>
        <p className="text-sm text-gray-600">Configure system preferences</p>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsSections.map((section) => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton
                    isActive={activeSection === section.id}
                    onClick={() => onSectionChange(section.id)}
                    className="w-full justify-start"
                  >
                    <section.icon className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{section.label}</span>
                      <span className="text-xs text-gray-500">{section.description}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-gray-500">
          <p>Settings are automatically saved</p>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
