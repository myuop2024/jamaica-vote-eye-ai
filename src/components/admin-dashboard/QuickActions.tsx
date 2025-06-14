
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Shield, FileText } from 'lucide-react';

interface QuickActionsProps {
  onNavigateToManagement: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigateToManagement }) => {
  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <CardDescription>Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start bg-green-600 hover:bg-green-700" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <Users className="w-4 h-4 mr-2" />
          Manage Observers
        </Button>
        <Button 
          className="w-full justify-start bg-blue-600 hover:bg-blue-700" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Communications
        </Button>
        <Button 
          className="w-full justify-start bg-purple-600 hover:bg-purple-700" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <Shield className="w-4 h-4 mr-2" />
          Verification Center
        </Button>
        <Button 
          className="w-full justify-start bg-orange-600 hover:bg-orange-700" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <FileText className="w-4 h-4 mr-2" />
          View Reports
        </Button>
      </CardContent>
    </Card>
  );
};
