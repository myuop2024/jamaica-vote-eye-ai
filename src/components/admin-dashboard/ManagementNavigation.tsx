
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, FileText, Shield, BarChart3, Mail, UserCheck, MapPin, FileSpreadsheet } from 'lucide-react';

interface ManagementNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const ManagementNavigation: React.FC<ManagementNavigationProps> = ({
  activeSection,
  onSectionChange
}) => {
  const managementSections = [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage observer accounts, roles, and permissions',
      color: 'bg-blue-500'
    },
    {
      id: 'inbox',
      label: 'Email Inbox',
      icon: Mail,
      description: 'Connect and manage Gmail accounts for communication',
      color: 'bg-purple-500'
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: MessageSquare,
      description: 'Send messages and manage communication campaigns',
      color: 'bg-green-500'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'Review and analyze observation reports',
      color: 'bg-orange-500'
    },
    {
      id: 'verification',
      label: 'Verification Center',
      icon: Shield,
      description: 'Verify observer credentials and documents',
      color: 'bg-red-500'
    },
    {
      id: 'identity-verification',
      label: 'Identity Verification',
      icon: UserCheck,
      description: 'Advanced identity verification with Didit',
      color: 'bg-indigo-500'
    },
    {
      id: 'stations',
      label: 'Polling Stations',
      icon: MapPin,
      description: 'Manage polling station assignments and locations',
      color: 'bg-teal-500'
    },
    {
      id: 'google-sheets',
      label: 'Google Sheets',
      icon: FileSpreadsheet,
      description: 'Import/export data to Google Sheets',
      color: 'bg-emerald-500'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Management Center
          </CardTitle>
          <CardDescription>
            Access all administrative tools and management features
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {managementSections.map((section) => (
          <Card 
            key={section.id} 
            className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={() => onSectionChange(section.id)}
          >
            <CardHeader className="text-center pb-2">
              <div className={`mx-auto w-12 h-12 rounded-full ${section.color} flex items-center justify-center mb-2`}>
                <section.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">{section.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-center pt-0">
              <CardDescription className="text-sm mb-4">
                {section.description}
              </CardDescription>
              <Button variant="outline" size="sm" className="w-full">
                Access
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
