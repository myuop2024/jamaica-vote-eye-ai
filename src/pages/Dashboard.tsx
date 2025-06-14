
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedAdminDashboard } from '@/components/EnhancedAdminDashboard';
import { ObserverDashboard } from '@/components/ObserverDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <EnhancedAdminDashboard />;
  }

  return <ObserverDashboard />;
};

export default Dashboard;
