
import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogHeader } from '@/components/ui/dialog';
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
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<User['role']>('observer');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers: User[] = (data || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role as User['role'],
        verificationStatus: profile.verification_status,
        profileImage: profile.profile_image,
        phoneNumber: profile.phone_number,
        assignedStation: profile.assigned_station,
        parish: profile.parish,
        address: profile.address,
        bankName: profile.bank_name,
        bankAccountNumber: profile.bank_account_number,
        bankRoutingNumber: profile.bank_routing_number,
        trn: profile.trn,
        createdAt: profile.created_at,
        lastLogin: profile.last_login
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
    try {
      await supabase.from('profiles').update({ role: newRole }).eq('id', editUser.id);
      await createNotification(
        editUser.id,
        'role_change',
        'Your role has been updated',
        `Your role is now ${ROLES.find(r => r.value === newRole)?.label || newRole}.`,
        { newRole, changedBy: currentUser?.id }
      );
      
      // Refresh users list
      await fetchUsers();
      
      setEditUser(null);
      toast({
        title: 'Role Changed',
        description: `User role updated to ${ROLES.find(r => r.value === newRole)?.label || newRole}`,
      });
    } catch (error) {
      console.error('Failed to update role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left p-2">Name</th>
            <th className="text-left p-2">Email</th>
            <th className="text-left p-2">Role</th>
            <th className="text-left p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleUsers.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.name}</td>
              <td className="p-2">{user.email}</td>
              <td className="p-2">{ROLES.find(r => r.value === user.role)?.label || user.role}</td>
              <td className="p-2">
                <Button 
                  size="sm" 
                  onClick={() => handleEditRole(user)} 
                  disabled={!canEditUser(user)}
                >
                  Edit Role
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <Dialog open={!!editUser} onOpenChange={v => !v && setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Select value={newRole} onValueChange={v => setNewRole(v as User['role'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 p-4">
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button onClick={handleSaveRole} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
