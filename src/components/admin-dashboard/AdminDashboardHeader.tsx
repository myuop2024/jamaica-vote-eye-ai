
import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface AdminDashboardHeaderProps {
  userName?: string;
  onLogout: () => void;
}

export const AdminDashboardHeader: React.FC<AdminDashboardHeaderProps> = ({
  userName,
  onLogout
}) => {
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
