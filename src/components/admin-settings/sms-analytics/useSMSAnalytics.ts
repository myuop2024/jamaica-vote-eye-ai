
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SMSLog, SMSStats } from './types';

export const useSMSAnalytics = () => {
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

  useEffect(() => {
    loadSMSData();
  }, [filterStatus, filterPeriod]);

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

  return {
    logs,
    stats,
    isLoading,
    filterStatus,
    setFilterStatus,
    filterPeriod,
    setFilterPeriod,
    loadSMSData,
    exportLogs
  };
};
