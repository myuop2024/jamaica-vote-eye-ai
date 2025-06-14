
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  phone_number?: string;
  assigned_station?: string;
  created_at: string;
  last_login?: string;
}

interface UserEditDialogProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (userId: string, status: 'pending' | 'verified' | 'rejected') => void;
}

export const UserEditDialog: React.FC<UserEditDialogProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateStatus
}) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Verification Status</Label>
            <Select
              value={user.verification_status}
              onValueChange={(value) => onUpdateStatus(user.id, value as 'pending' | 'verified' | 'rejected')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
