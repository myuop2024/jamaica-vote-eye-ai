
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalObservers: number;
  verified: number;
  pending: number;
  flagged: number;
  totalReports: number;
}

export interface RecentActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'user' | 'report' | 'verification' | 'communication';
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  // Fetch user counts by verification status
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('verification_status, role');

  if (profilesError) throw profilesError;

  // Count observers by verification status
  const observers = profiles?.filter(p => p.role === 'observer') || [];
  const verified = observers.filter(o => o.verification_status === 'verified').length;
  const pending = observers.filter(o => o.verification_status === 'pending').length;
  const flagged = observers.filter(o => o.verification_status === 'rejected').length;

  // Fetch total reports count
  const { count: totalReports, error: reportsError } = await supabase
    .from('observation_reports')
    .select('*', { count: 'exact', head: true });

  if (reportsError) throw reportsError;

  return {
    totalObservers: observers.length,
    verified,
    pending,
    flagged,
    totalReports: totalReports || 0
  };
};

const fetchRecentActivity = async (): Promise<RecentActivity[]> => {
  // Fetch recent observation reports
  const { data: reports, error: reportsError } = await supabase
    .from('observation_reports')
    .select(`
      id,
      created_at,
      status,
      profiles!observer_id (name)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (reportsError) throw reportsError;

  // Fetch recent profile updates
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, verification_status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (profilesError) throw profilesError;

  const activities: RecentActivity[] = [];

  // Add recent reports
  reports?.forEach(report => {
    activities.push({
      id: report.id,
      action: `Report ${report.status}`,
      user: report.profiles?.name || 'Unknown User',
      time: new Date(report.created_at).toLocaleTimeString(),
      type: 'report'
    });
  });

  // Add recent user registrations
  profiles?.forEach(profile => {
    activities.push({
      id: profile.id,
      action: `User registered - ${profile.verification_status}`,
      user: profile.name,
      time: new Date(profile.created_at).toLocaleTimeString(),
      type: 'user'
    });
  });

  // Sort by time and return top 10
  return activities
    .sort((a, b) => new Date(`1970/01/01 ${b.time}`).getTime() - new Date(`1970/01/01 ${a.time}`).getTime())
    .slice(0, 10);
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: fetchRecentActivity,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
};
