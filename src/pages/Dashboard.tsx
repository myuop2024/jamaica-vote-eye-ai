
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedAdminDashboard } from '@/components/EnhancedAdminDashboard';
import { ObserverDashboard } from '@/components/ObserverDashboard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const { user, isLoading } = useAuth();

  console.log('Dashboard: Rendering with user:', user);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert variant="destructive" className="mx-4 mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No user found. Please log in again.
        </AlertDescription>
      </Alert>
    );
  }

  try {
    if (user.role === 'admin') {
      console.log('Dashboard: Rendering admin dashboard');
      return <EnhancedAdminDashboard />;
    }

    console.log('Dashboard: Rendering observer dashboard for role:', user.role);
    return <ObserverDashboard />;
  } catch (error) {
    console.error('Dashboard: Error rendering dashboard:', error);
    return (
      <Alert variant="destructive" className="mx-4 mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }
};

export default Dashboard;
