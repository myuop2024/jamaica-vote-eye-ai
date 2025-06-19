import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserNotifications, markNotificationRead } from '@/services/notificationService';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface AdminDashboardHeaderProps {
  userName?: string;
  onLogout: () => void;
}

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
  userName,
  onLogout
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let interval: any;
    const fetchNotifications = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) return;
      const { data } = await getUserNotifications(userId);
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: any) => !n.read).length);
    };
    fetchNotifications();
    interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark all as read
      for (const n of notifications) {
        if (!n.read) await markNotificationRead(n.id);
      }
      setUnreadCount(0);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3 sm:py-4">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Electoral Observation Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            <button className="relative" onClick={handleOpenNotifications}>
              <Bell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white">{unreadCount}</Badge>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-4 top-16 z-50 w-80 bg-white border rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-bold mb-2">Notifications</h4>
                {notifications.length === 0 && <div className="text-gray-500">No notifications</div>}
                {notifications.map((n) => (
                  <Alert key={n.id} className="mb-2">
                    <AlertTitle>{n.title}</AlertTitle>
                    <AlertDescription>{n.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-32">{userName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
