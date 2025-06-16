import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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