import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createNotification } from '@/services/notificationService';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'observer', label: 'Observer' },
  { value: 'roving_observer', label: 'Roving Observer' },
  { value: 'parish_coordinator', label: 'Parish Coordinator' },
];

export const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<User['role']>('observer');
  const [saving, setSaving] = useState(false);

  // Filter users based on currentUser role
  let visibleUsers = users;
  if (currentUser?.role === 'parish_coordinator' || currentUser?.role === 'roving_observer') {
    visibleUsers = users.filter(u => u.assignedStation === currentUser.assignedStation);
  }

  const canEditUser = (targetUser: User) => {
    if (currentUser?.role === 'admin') return true;
    if ((currentUser?.role === 'parish_coordinator' || currentUser?.role === 'roving_observer') && targetUser.assignedStation === currentUser.assignedStation) {
      // Prevent parish coordinators/roving observers from editing admins
      return targetUser.role !== 'admin';
    }
    return false;
  };

  const handleEditRole = (user: User) => {
    setEditUser(user);
    setNewRole(user.role);
  };

  const handleSaveRole = async () => {
    if (!editUser) return;
    setSaving(true);
    await supabase.from('profiles').update({ role: newRole }).eq('id', editUser.id);
    await createNotification(
      editUser.id,
      'role_change',
      'Your role has been updated',
      `Your role is now ${ROLES.find(r => r.value === newRole)?.label || newRole}.`,
      { newRole, changedBy: currentUser?.id }
    );
    // Optionally refetch users here
    setEditUser(null);
    setSaving(false);
    toast({
      title: 'Role Changed',
      description: `User role updated to ${ROLES.find(r => r.value === newRole)?.label || newRole}`,
      variant: 'success',
    });
  };

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map(user => (
            <tr key={user.id}>
              <td>{ROLES.find(r => r.value === user.role)?.label || user.role}</td>
              <td>
                <Button onClick={() => handleEditRole(user)} disabled={!canEditUser(user)}>Edit Role</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Dialog open={!!editUser} onOpenChange={v => !v && setEditUser(null)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <Select value={newRole} onValueChange={v => setNewRole(v as User['role'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map(role => (
                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveRole} disabled={saving}>Save</Button>
          <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}; 