
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  MessageSquare,
  Database,
  Wifi,
  Server,
  Lock,
  Eye
} from 'lucide-react';

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  database: 'online' | 'slow' | 'offline';
  apiServices: 'operational' | 'degraded' | 'down';
  authentication: 'active' | 'issues' | 'failed';
  messaging: 'working' | 'delayed' | 'failed';
}

interface SecurityAlert {
  id: string;
  type: 'login_attempt' | 'data_access' | 'system_change' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface SystemMetrics {
  activeUsers: number;
  totalReports: number;
  verificationsPending: number;
  messagesLastHour: number;
  systemUptime: string;
  responseTime: number;
}

export const SystemMonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    database: 'online',
    apiServices: 'operational',
    authentication: 'active',
    messaging: 'working'
  });

  const [metrics, setMetrics] = useState<SystemMetrics>({
    activeUsers: 0,
    totalReports: 0,
    verificationsPending: 0,
    messagesLastHour: 0,
    systemUptime: '99.8%',
    responseTime: 0
  });

  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([
    {
      id: '1',
      type: 'login_attempt',
      severity: 'medium',
      message: 'Multiple failed login attempts detected from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      resolved: false
    },
    {
      id: '2',
      type: 'system_change',
      severity: 'low',
      message: 'User permissions updated for admin account',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      resolved: true
    },
    {
      id: '3',
      type: 'api_abuse',
      severity: 'high',
      message: 'Unusual API request pattern detected - rate limiting applied',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      resolved: false
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Simulate fetching real-time data
    const fetchMetrics = () => {
      setMetrics({
        activeUsers: Math.floor(Math.random() * 50) + 150,
        totalReports: Math.floor(Math.random() * 100) + 1200,
        verificationsPending: Math.floor(Math.random() * 20) + 5,
        messagesLastHour: Math.floor(Math.random() * 50) + 20,
        systemUptime: '99.8%',
        responseTime: Math.floor(Math.random() * 100) + 50
      });
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate data refresh
    setMetrics(prev => ({
      ...prev,
      activeUsers: Math.floor(Math.random() * 50) + 150,
      messagesLastHour: Math.floor(Math.random() * 50) + 20,
      responseTime: Math.floor(Math.random() * 100) + 50
    }));

    setIsRefreshing(false);
    toast({
      title: "Data Refreshed",
      description: "System metrics have been updated"
    });
  };

  const resolveAlert = (alertId: string) => {
    setSecurityAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
    toast({
      title: "Alert Resolved",
      description: "Security alert has been marked as resolved"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'operational':
      case 'active':
      case 'working':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'slow':
      case 'degraded':
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'offline':
      case 'down':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unresolvedAlerts = securityAlerts.filter(alert => !alert.resolved);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Monitoring</h2>
          <p className="text-gray-600">Real-time system health and security monitoring</p>
        </div>
        <Button 
          onClick={refreshData}
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Refreshing...
            </div>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Status</p>
                <Badge className={getStatusColor(systemHealth.status)}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {systemHealth.status.charAt(0).toUpperCase() + systemHealth.status.slice(1)}
                </Badge>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Database</p>
                <Badge className={getStatusColor(systemHealth.database)}>
                  <Database className="w-3 h-3 mr-1" />
                  {systemHealth.database.charAt(0).toUpperCase() + systemHealth.database.slice(1)}
                </Badge>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">API Services</p>
                <Badge className={getStatusColor(systemHealth.apiServices)}>
                  <Server className="w-3 h-3 mr-1" />
                  {systemHealth.apiServices.charAt(0).toUpperCase() + systemHealth.apiServices.slice(1)}
                </Badge>
              </div>
              <Server className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Authentication</p>
                <Badge className={getStatusColor(systemHealth.authentication)}>
                  <Lock className="w-3 h-3 mr-1" />
                  {systemHealth.authentication.charAt(0).toUpperCase() + systemHealth.authentication.slice(1)}
                </Badge>
              </div>
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Messaging</p>
                <Badge className={getStatusColor(systemHealth.messaging)}>
                  <MessageSquare className="w-3 h-3 mr-1" />
                  {systemHealth.messaging.charAt(0).toUpperCase() + systemHealth.messaging.slice(1)}
                </Badge>
              </div>
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="security">
            Security Alerts
            {unresolvedAlerts.length > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800">
                {unresolvedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Active Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.activeUsers}</div>
                <p className="text-sm text-gray-600">Currently online</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages Sent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.messagesLastHour}</div>
                <p className="text-sm text-gray-600">Last hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.responseTime}ms</div>
                <p className="text-sm text-gray-600">Average API response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{metrics.totalReports}</div>
                <p className="text-sm text-gray-600">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Verifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">{metrics.verificationsPending}</div>
                <p className="text-sm text-gray-600">Awaiting review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{metrics.systemUptime}</div>
                <p className="text-sm text-gray-600">Last 30 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-4">
            {unresolvedAlerts.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have {unresolvedAlerts.length} unresolved security alert(s) that require attention.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {alert.type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          {alert.resolved && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                System activity and user action logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: 'User login', user: 'admin@example.com', timestamp: '2 minutes ago', status: 'success' },
                  { action: 'Report submitted', user: 'observer@example.com', timestamp: '5 minutes ago', status: 'success' },
                  { action: 'Communication sent', user: 'admin@example.com', timestamp: '10 minutes ago', status: 'success' },
                  { action: 'User verification', user: 'system', timestamp: '15 minutes ago', status: 'success' },
                  { action: 'Failed login attempt', user: 'unknown', timestamp: '20 minutes ago', status: 'failed' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{log.action}</div>
                      <div className="text-xs text-gray-500">by {log.user}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">{log.timestamp}</div>
                      <Badge className={log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
