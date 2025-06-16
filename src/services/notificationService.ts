
// Simplified notification service that logs to console
// This can be enhanced later when the notifications table is properly set up

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
) {
  console.log('Notification created:', { userId, type, title, message, data });
  return { data: null, error: null };
}

export async function getUserNotifications(userId: string) {
  console.log('Getting notifications for user:', userId);
  return [];
}

export async function markNotificationRead(id: number) {
  console.log('Marking notification as read:', id);
  return { data: null, error: null };
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
