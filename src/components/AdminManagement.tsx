
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, FileText, Shield, BarChart3 } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { CommunicationsManager } from './CommunicationsManager';
import { ReportsManager } from './ReportsManager';
import { VerificationCenter } from './VerificationCenter';

export const AdminManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  const managementSections = [
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      description: 'Manage observer accounts and permissions',
      component: UserManagement
    },
    {
      id: 'communications',
      label: 'Communications',
      icon: MessageSquare,
      description: 'Send messages and manage campaigns',
      component: CommunicationsManager
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'Review observation reports',
      component: ReportsManager
    },
    {
      id: 'verification',
      label: 'Verification',
      icon: Shield,
      description: 'Verify observer credentials',
      component: VerificationCenter
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Admin Management Center
          </CardTitle>
          <CardDescription>
            Comprehensive tools for managing the electoral observation system
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {managementSections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              <section.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{section.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {managementSections.map((section) => (
          <TabsContent key={section.id} value={section.id}>
            <section.component />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
