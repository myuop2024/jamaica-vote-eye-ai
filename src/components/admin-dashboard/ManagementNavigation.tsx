
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageSquare, 
  Shield, 
  FileText, 
  MapPin,
  Settings
} from 'lucide-react';

interface ManagementNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    description: 'Manage observers and verification',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    id: 'communications',
    label: 'Communications',
    icon: MessageSquare,
    description: 'Send SMS and WhatsApp messages',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    id: 'verification',
    label: 'Verification Center',
    icon: Shield,
    description: 'Review documents and approve users',
    color: 'bg-purple-500 hover:bg-purple-600'
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: FileText,
    description: 'View and analyze observation reports',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    id: 'stations',
    label: 'Polling Stations',
    icon: MapPin,
    description: 'Manage polling station assignments',
    color: 'bg-red-500 hover:bg-red-600'
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    description: 'Configure system preferences',
    color: 'bg-gray-500 hover:bg-gray-600'
  }
];

export const ManagementNavigation: React.FC<ManagementNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Management Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "default" : "outline"}
              className={`h-auto p-4 justify-start flex-col space-y-2 ${
                activeSection === item.id 
                  ? item.color + ' text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className="w-6 h-6" />
              <div className="text-center">
                <div className="font-semibold">{item.label}</div>
                <div className="text-xs opacity-80">{item.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
