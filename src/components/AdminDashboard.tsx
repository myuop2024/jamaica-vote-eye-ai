
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, MessageSquare, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const stats = [
    { label: 'Total Observers', value: '124', icon: Users, color: 'bg-blue-500' },
    { label: 'Verified', value: '98', icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Pending', value: '18', icon: Clock, color: 'bg-yellow-500' },
    { label: 'Flagged', value: '8', icon: AlertTriangle, color: 'bg-red-500' }
  ];

  const recentActivity = [
    { action: 'New observer registered', user: 'John Brown', time: '2 mins ago', type: 'user' },
    { action: 'Report submitted', user: 'Sarah Wilson', time: '15 mins ago', type: 'report' },
    { action: 'Verification completed', user: 'Michael Chen', time: '1 hour ago', type: 'verification' },
    { action: 'SMS campaign sent', user: 'System', time: '2 hours ago', type: 'communication' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-yellow-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Electoral Observation Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <Button 
                variant="outline" 
                onClick={logout}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-green-600 hover:bg-green-700" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Manage Observers
              </Button>
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Communications
              </Button>
              <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700" size="sm">
                <Shield className="w-4 h-4 mr-2" />
                Verification Center
              </Button>
              <Button className="w-full justify-start bg-orange-600 hover:bg-orange-700" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                View Reports
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      {activity.type === 'user' && <Users className="w-5 h-5 text-blue-500" />}
                      {activity.type === 'report' && <FileText className="w-5 h-5 text-green-500" />}
                      {activity.type === 'verification' && <Shield className="w-5 h-5 text-purple-500" />}
                      {activity.type === 'communication' && <MessageSquare className="w-5 h-5 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.user}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
