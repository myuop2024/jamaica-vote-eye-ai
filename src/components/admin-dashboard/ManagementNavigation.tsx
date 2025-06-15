
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Mail, 
  Shield, 
  FileText, 
  MapPin, 
  Settings,
  Inbox,
  MessageSquare
} from 'lucide-react';

interface ManagementNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const managementSections = [
  {
    id: 'users',
    title: 'User Management',
    description: 'Manage observers, administrators, and user accounts',
    icon: Users,
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    id: 'inbox',
    title: 'Email Inbox',
    description: 'Manage email accounts and view messages',
    icon: Inbox,
    color: 'bg-green-50 text-green-600 border-green-200'
  },
  {
    id: 'communications',
    title: 'Communications',
    description: 'Send messages and manage communication campaigns',
    icon: MessageSquare,
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  {
    id: 'verification',
    title: 'Verification Center',
    description: 'Review and approve observer verification requests',
    icon: Shield,
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
  },
  {
    id: 'identity-verification',
    title: 'Identity Verification',
    description: 'Manage Didit identity verification system',
    icon: Shield,
    color: 'bg-orange-50 text-orange-600 border-orange-200'
  },
  {
    id: 'reports',
    title: 'Reports Management',
    description: 'View and analyze observation reports',
    icon: FileText,
    color: 'bg-red-50 text-red-600 border-red-200'
  },
  {
    id: 'stations',
    title: 'Polling Stations',
    description: 'Manage polling station information and assignments',
    icon: MapPin,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  {
    id: 'settings',
    title: 'System Settings',
    description: 'Configure system preferences and integrations',
    icon: Settings,
    color: 'bg-gray-50 text-gray-600 border-gray-200'
  }
];

export const ManagementNavigation: React.FC<ManagementNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Management Center</h2>
        <p className="text-gray-600">
          Access all administrative tools and management functions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementSections.map((section) => (
          <Card 
            key={section.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSectionChange(section.id)}
          >
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mb-3`}>
                <section.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription className="text-sm">
                {section.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onSectionChange(section.id);
                }}
              >
                Access {section.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
