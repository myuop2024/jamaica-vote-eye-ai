
import { useAuth } from '@/contexts/AuthContext';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ObserverDashboard } from '@/components/ObserverDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <ObserverDashboard />;
};

export default Dashboard;
