
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminManagement } from './AdminManagement';
import { AdminDashboardHeader } from './admin-dashboard/AdminDashboardHeader';
import { DashboardOverview } from './admin-dashboard/DashboardOverview';

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

  const handleNavigateToManagement = () => {
    setActiveTab('management');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <AdminDashboardHeader userName={user?.name} onLogout={logout} />

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
            <DashboardOverview
              stats={stats}
              recentActivity={recentActivity}
              onNavigateToManagement={handleNavigateToManagement}
            />
          </TabsContent>

          <TabsContent value="management">
            <AdminManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
