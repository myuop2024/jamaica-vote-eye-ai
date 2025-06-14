
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchUsers, performBulkAction, updateUserStatus, deleteUser } from './UserOperations';

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

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stationFilter, setStationFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone_number && user.phone_number.includes(searchTerm))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.verification_status === statusFilter);
    }

    // Station filter
    if (stationFilter !== 'all') {
      filtered = filtered.filter(user => user.assigned_station === stationFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      if (dateFilter !== 'all') {
        filtered = filtered.filter(user => 
          new Date(user.created_at) >= filterDate
        );
      }
    }

    setFilteredUsers(filtered);
  };

  const handleBulkAction = async (action: string, value?: string) => {
    if (selectedUsers.length === 0) return;

    try {
      if (action === 'email') {
        toast({
          title: "Email Feature",
          description: "Bulk email functionality will be implemented in the communications phase"
        });
        return;
      }

      await performBulkAction(action, selectedUsers, value);

      toast({
        title: "Success",
        description: `Updated ${selectedUsers.length} users`
      });

      loadUsers();
      setSelectedUsers([]);
    } catch (error: any) {
      console.error('Error performing bulk action:', error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive"
      });
    }
  };

  const handleUserSelection = (userId: string, selected: boolean) => {
    setSelectedUsers(prev => 
      selected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    );
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
    setStationFilter('all');
    setDateFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (roleFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    if (stationFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    return count;
  };

  const handleUpdateUserStatus = async (userId: string, status: 'pending' | 'verified' | 'rejected') => {
    try {
      await updateUserStatus(userId, status);
      toast({
        title: "Success",
        description: "User status updated successfully"
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = (user: UserProfile) => {
    toast({
      title: "Message Feature",
      description: "Direct messaging will be implemented in the communications phase"
    });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter, stationFilter, dateFilter]);

  return {
    // State
    users,
    filteredUsers,
    selectedUsers,
    isLoading,
    searchTerm,
    roleFilter,
    statusFilter,
    stationFilter,
    dateFilter,
    selectedUser,
    isEditDialogOpen,
    isDetailsDialogOpen,
    
    // Setters
    setSearchTerm,
    setRoleFilter,
    setStatusFilter,
    setStationFilter,
    setDateFilter,
    setSelectedUser,
    setIsEditDialogOpen,
    setIsDetailsDialogOpen,
    
    // Actions
    handleBulkAction,
    handleUserSelection,
    clearSelection,
    clearFilters,
    getActiveFiltersCount,
    handleUpdateUserStatus,
    handleDeleteUser,
    handleSendMessage,
    loadUsers
  };
};
