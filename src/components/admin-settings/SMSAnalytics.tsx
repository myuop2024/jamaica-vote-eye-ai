
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

interface SMSLog {
  id: string;
  recipient_phone: string;
  message_content: string;
  external_id: string;
  sent_at: string;
  delivered_at?: string;
  error_message?: string;
  communication_id: string;
  campaign_name?: string;
  created_at: string;
}

interface SMSStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  last24h: number;
  thisMonth: number;
}

export const SMSAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [stats, setStats] = useState<SMSStats>({
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    deliveryRate: 0,
    last24h: 0,
    thisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('7d');

  useEffect(() => {
    loadSMSData();
  }, [filterStatus, filterPeriod]);

  const loadSMSData = async () => {
    try {
      setIsLoading(true);

      // Load SMS logs
      let query = supabase
        .from('communication_logs')
        .select(`
          *,
          communications!inner(campaign_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (filterStatus !== 'all') {
        if (filterStatus === 'delivered') {
          query = query.not('delivered_at', 'is', null);
        } else if (filterStatus === 'failed') {
          query = query.not('error_message', 'is', null);
        } else if (filterStatus === 'pending') {
          query = query.is('delivered_at', null).is('error_message', null);
        }
      }

      // Apply time filter
      if (filterPeriod !== 'all') {
        const now = new Date();
        let filterDate = new Date();
        
        switch (filterPeriod) {
          case '24h':
            filterDate.setHours(now.getHours() - 24);
            break;
          case '7d':
            filterDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            filterDate.setDate(now.getDate() - 30);
            break;
        }
        
        query = query.gte('created_at', filterDate.toISOString());
      }

      const { data: logsData, error: logsError } = await query;
      if (logsError) throw logsError;

      setLogs(logsData || []);

      // Calculate statistics
      const totalSent = logsData?.length || 0;
      const totalDelivered = logsData?.filter(log => log.delivered_at).length || 0;
      const totalFailed = logsData?.filter(log => log.error_message).length || 0;
      const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

      // Calculate last 24h
      const last24h = new Date();
      last24h.setHours(last24h.getHours() - 24);
      const last24hCount = logsData?.filter(log => 
        new Date(log.created_at) > last24h
      ).length || 0;

      // Calculate this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthCount = logsData?.filter(log => 
        new Date(log.created_at) > thisMonth
      ).length || 0;

      setStats({
        totalSent,
        totalDelivered,
        totalFailed,
        deliveryRate,
        last24h: last24hCount,
        thisMonth: thisMonthCount
      });

    } catch (error: any) {
      console.error('Error loading SMS data:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS analytics data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (log: SMSLog) => {
    if (log.error_message) {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    } else if (log.delivered_at) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Phone', 'Message', 'Campaign', 'Status', 'Error'].join(','),
      ...logs.map(log => [
        new Date(log.sent_at || log.created_at).toLocaleString(),
        log.recipient_phone,
        `"${log.message_content.replace(/"/g, '""')}"`,
        log.campaign_name || 'N/A',
        log.error_message ? 'Failed' : log.delivered_at ? 'Delivered' : 'Pending',
        log.error_message || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" />
            SMS Analytics & Logs
          </h1>
          <p className="text-gray-600">Monitor SMS delivery performance and view detailed logs</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSMSData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDelivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveryRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">Last 24 Hours</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.last24h}</p>
            <p className="text-sm text-gray-600">SMS messages sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-2">This Month</h3>
            <p className="text-3xl font-bold text-green-600">{stats.thisMonth}</p>
            <p className="text-sm text-gray-600">SMS messages sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            SMS Logs
          </CardTitle>
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Message Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.sent_at || log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono">{log.recipient_phone}</TableCell>
                    <TableCell>{log.campaign_name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={log.message_content}>
                        {log.message_content}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(log)}</TableCell>
                    <TableCell>
                      {log.delivered_at ? (
                        <span className="text-sm text-gray-600">
                          {new Date(log.delivered_at).toLocaleString()}
                        </span>
                      ) : log.error_message ? (
                        <span className="text-sm text-red-600" title={log.error_message}>
                          Failed
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-600">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No SMS logs found for the selected filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
