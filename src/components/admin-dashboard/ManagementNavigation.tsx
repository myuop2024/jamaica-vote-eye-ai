
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  MessageSquare, 
  Shield, 
  FileText, 
  MapPin, 
  Settings,
  UserCheck,
  Eye,
  TrendingUp
} from 'lucide-react';

interface ManagementNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const ManagementNavigation: React.FC<ManagementNavigationProps> = ({
  onSectionChange
}) => {
  const managementSections = [
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage observer accounts, roles, and permissions',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      id: 'verification',
      title: 'Document Verification',
      description: 'Review and verify observer documentation',
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      id: 'identity-verification',
      title: 'Identity Verification',
      description: 'Manage didit identity verification system',
      icon: Shield,
      color: 'bg-purple-500'
    },
    {
      id: 'communications',
      title: 'Communications',
      description: 'Send messages and manage communication campaigns',
      icon: MessageSquare,
      color: 'bg-yellow-500'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'View observation reports and system analytics',
      icon: FileText,
      color: 'bg-red-500'
    },
    {
      id: 'stations',
      title: 'Polling Stations',
      description: 'Manage polling station information and assignments',
      icon: MapPin,
      color: 'bg-indigo-500'
    },
    {
      id: 'settings',
      title: 'System Settings',
      description: 'Configure system preferences and integrations',
      icon: Settings,
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Management Center</h1>
        <p className="text-gray-600 mt-2">
          Access all administrative tools and system management features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementSections.map((section) => (
          <Card key={section.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${section.color}`}>
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {section.description}
              </CardDescription>
              <Button 
                onClick={() => onSectionChange(section.id)}
                className="w-full"
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Access {section.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <TrendingUp className="w-5 h-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">24/7</div>
              <div className="text-sm text-green-600">System Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">99.9%</div>
              <div className="text-sm text-green-600">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">Real-time</div>
              <div className="text-sm text-green-600">Data Updates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">Secure</div>
              <div className="text-sm text-green-600">Infrastructure</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
