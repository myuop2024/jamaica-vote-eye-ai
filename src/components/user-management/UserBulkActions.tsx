
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail, Shield, Ban } from 'lucide-react';

interface UserBulkActionsProps {
  selectedUsers: string[];
  onBulkAction: (action: string, value?: string) => void;
  onClearSelection: () => void;
}

export const UserBulkActions: React.FC<UserBulkActionsProps> = ({
  selectedUsers,
  onBulkAction,
  onClearSelection
}) => {
  if (selectedUsers.length === 0) return null;

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Users className="w-3 h-3 mr-1" />
              {selectedUsers.length} selected
            </Badge>
            
            <div className="flex items-center gap-2">
              <Select onValueChange={(value) => onBulkAction('status', value)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Change Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verify Users</SelectItem>
                  <SelectItem value="pending">Set Pending</SelectItem>
                  <SelectItem value="rejected">Reject Users</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={(value) => onBulkAction('role', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Change Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Make Admin</SelectItem>
                  <SelectItem value="observer">Make Observer</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkAction('email')}
                className="text-blue-600"
              >
                <Mail className="w-3 h-3 mr-1" />
                Send Email
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-500"
          >
            Clear Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
