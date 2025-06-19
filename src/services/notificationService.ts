import { supabase } from '@/integrations/supabase/client';

// Simplified notification service that logs to console
// This can be enhanced later when the notifications table is properly set up

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  const { data: notif, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false
    });
  return { data: notif, error };
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

export async function markNotificationRead(id: number) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  return { data, error };
}

export async function notifyChatEvent(
  userId: string,
  type: string,
  message: string,
  data?: Record<string, unknown>
) {
  return createNotification(
    userId,
    type,
    'Chat Notification',
    message,
    data
  );
}
