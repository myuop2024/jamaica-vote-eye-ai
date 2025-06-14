
import { supabase } from '@/integrations/supabase/client';

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

export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
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
