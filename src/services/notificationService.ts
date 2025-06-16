
import { supabase } from '@/integrations/supabase/client';

export async function createNotification(userId: string, type: string, title: string, message: string, data?: any) {
  return supabase.from('notifications').insert([
    { user_id: userId, type, title, message, data }
  ]);
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function markNotificationRead(id: number) {
  return supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function notifyChatEvent(userId: string, type: string, message: string, data?: any) {
  return createNotification(
    userId,
    type,
    'Chat Notification',
    message,
    data
  );
} 
