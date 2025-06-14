
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, MessageSquare, FileText, CheckCircle, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminManagement } from './AdminManagement';

interface DashboardStats {
  totalObservers: number;
  verified: number;
  pending: number;
  flagged: number;
  totalReports: number;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'user' | 'report' | 'verification' | 'communication';
}

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalObservers: 0,
    verified: 0,
    pending: 0,
    flagged: 0,
    totalReports: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch observer statistics
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('verification_status, role')
        .eq('role', 'observer');

      if (profilesError) throw profilesError;

      // Calculate stats
      const totalObservers = profiles?.length || 0;
      const verified = profiles?.filter(p => p.verification_status === 'verified').length || 0;
      const pending = profiles?.filter(p => p.verification_status === 'pending').length || 0;
      const flagged = profiles?.filter(p => p.verification_status === 'rejected').length || 0;

      // Fetch reports count
      const { count: reportsCount, error: reportsError } = await supabase
        .from('observation_reports')
        .select('*', { count: 'exact', head: true });

      if (reportsError) throw reportsError;

      setStats({
        totalObservers,
        verified,
        pending,
        flagged,
        totalReports: reportsCount || 0
      });

      // Fetch recent activity (reports)
      const { data: recentReports, error: recentError } = await supabase
        .from('observation_reports')
        .select(`
          id,
          created_at,
          profiles!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const activities: RecentActivity[] = recentReports?.map(report => ({
        id: report.id,
        action: 'Report submitted',
        user: report.profiles.name,
        time: formatTimeAgo(new Date(report.created_at)),
        type: 'report' as const
      })) || [];

      setRecentActivity(activities);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  const statCards = [
    { 
      label: 'Total Observers', 
      value: stats.totalObservers.toString(), 
      icon: Users, 
      color: 'bg-blue-500' 
    },
    { 
      label: 'Verified', 
      value: stats.verified.toString(), 
      icon: CheckCircle, 
      color: 'bg-green-500' 
    },
    { 
      label: 'Pending', 
      value: stats.pending.toString(), 
      icon: Clock, 
      color: 'bg-yellow-500' 
    },
    { 
      label: 'Flagged', 
      value: stats.flagged.toString(), 
      icon: AlertTriangle, 
      color: 'bg-red-500' 
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, index) => (
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
                  <Button 
                    className="w-full justify-start bg-green-600 hover:bg-green-700" 
                    size="sm"
                    onClick={() => setActiveTab('management')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Observers
                  </Button>
                  <Button 
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700" 
                    size="sm"
                    onClick={() => setActiveTab('management')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Communications
                  </Button>
                  <Button 
                    className="w-full justify-start bg-purple-600 hover:bg-purple-700" 
                    size="sm"
                    onClick={() => setActiveTab('management')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Verification Center
                  </Button>
                  <Button 
                    className="w-full justify-start bg-orange-600 hover:bg-orange-700" 
                    size="sm"
                    onClick={() => setActiveTab('management')}
                  >
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
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0">
                            <FileText className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-500">{activity.user}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.time}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management">
            <AdminManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
