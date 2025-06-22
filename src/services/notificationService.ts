
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/notifications';

export const createNotification = async (notification: {
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notification)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('read', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const markNotificationAsRead = async (notificationId: number) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
};

export const notifyChatEvent = async (
  userId: string,
  type: string,
  title: string,
  data?: any
) => {
  try {
    await createNotification({
      user_id: userId,
      type,
      title,
      message: title,
      data,
    });
  } catch (error) {
    console.error('Failed to create chat notification:', error);
  }
};

export const notifyAllUsers = async (notification: {
  type: string;
  title: string;
  message: string;
  data?: any;
}) => {
  const { data, error } = await supabase.functions.invoke('notify-all-users', {
    body: notification,
  });

  if (error) {
    console.error('Error calling notify-all-users function:', error);
    throw error;
  }

  if (data && data.error) {
    console.error('Error from notify-all-users function:', data.error);
    throw new Error(data.error);
  }

  console.log('Notify all users function response:', data);
  return data;
};
