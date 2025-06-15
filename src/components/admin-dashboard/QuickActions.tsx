
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, MessageSquare, Shield, FileText } from 'lucide-react';

interface QuickActionsProps {
  onNavigateToManagement: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigateToManagement }) => {
  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <CardDescription className="text-sm">Common administrative tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          className="w-full justify-start bg-green-600 hover:bg-green-700 text-sm" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <Users className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Manage Observers</span>
        </Button>
        <Button 
          className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-sm" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Send Communications</span>
        </Button>
        <Button 
          className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-sm" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Verification Center</span>
        </Button>
        <Button 
          className="w-full justify-start bg-orange-600 hover:bg-orange-700 text-sm" 
          size="sm"
          onClick={onNavigateToManagement}
        >
          <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">View Reports</span>
        </Button>
      </CardContent>
    </Card>
  );
};
