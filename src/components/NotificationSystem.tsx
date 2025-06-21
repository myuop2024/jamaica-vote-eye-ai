
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserNotifications, markNotificationRead } from '@/services/notificationService';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

interface PopupNotificationProps {
  notification: Notification;
  onClose: () => void;
}

const PopupNotification: React.FC<PopupNotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 shadow-lg animate-slide-in-right bg-white border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">{notification.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm">{notification.message}</CardDescription>
      </CardContent>
    </Card>
  );
};

export const NotificationSystem: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [popupNotifications, setPopupNotifications] = useState<Notification[]>([]);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`user_${user.id}`)
      .on('broadcast', { event: 'new_notification' }, (payload) => {
        const newNotification = payload.payload as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setPopupNotifications(prev => [...prev, newNotification]);
        
        // Shake the bell icon
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 1000);
      })
      .subscribe();

    // Also listen for database changes
    const dbChannel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setPopupNotifications(prev => [...prev, newNotification]);
          
          // Shake the bell icon
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(dbChannel);
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    const { data, error } = await getUserNotifications(user.id);
    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    
    if (!showDropdown) {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        await markNotificationRead(notification.id);
      }
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const closePopupNotification = (notificationId: number) => {
    setPopupNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (!user) return null;

  return (
    <>
      {/* Bell Icon */}
      <div className="relative">
        <button 
          onClick={handleBellClick}
          className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors ${
            isShaking ? 'animate-bounce' : ''
          }`}
        >
          <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-red-500' : 'text-gray-700'}`} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-500 text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-12 z-50 w-80 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <div className="p-4 border-b">
              <h4 className="font-semibold">Notifications</h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popup Notifications */}
      {popupNotifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{ top: `${4 + index * 100}px` }}
          className="fixed right-4 z-50"
        >
          <PopupNotification
            notification={notification}
            onClose={() => closePopupNotification(notification.id)}
          />
        </div>
      ))}
    </>
  );
};
