
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

export const updateUserStatus = async (userId: string, status: 'pending' | 'verified' | 'rejected') => {
  const { error } = await supabase
    .from('profiles')
    .update({ verification_status: status })
    .eq('id', userId);

  if (error) throw error;
};

export const deleteUser = async (userId: string) => {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
};

export const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Map database fields to User interface format
  return (data || []).map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as User['role'],
    verificationStatus: user.verification_status,
    createdAt: user.created_at,
    phoneNumber: user.phone_number,
    assignedStation: user.assigned_station,
    lastLogin: user.last_login,
    profileImage: user.profile_image,
    deploymentParish: user.deployment_parish,
    parish: user.parish,
    address: user.address,
    bankName: user.bank_name,
    bankAccountNumber: user.bank_account_number,
    bankRoutingNumber: user.bank_routing_number,
    trn: user.trn,
    date_of_birth: user.date_of_birth,
    unique_user_id: user.unique_user_id
  }));
};

export const performBulkAction = async (action: string, selectedUsers: string[], value?: string) => {
  if (action === 'status' && value) {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: value as 'pending' | 'verified' | 'rejected' })
      .in('id', selectedUsers);

    if (error) throw error;
  } else if (action === 'role' && value) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: value })
      .in('id', selectedUsers);

    if (error) throw error;
  }
};
