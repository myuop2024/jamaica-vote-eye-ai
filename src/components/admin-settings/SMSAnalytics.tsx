
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { useSMSAnalytics } from './sms-analytics/useSMSAnalytics';
import { SMSStatsCards } from './sms-analytics/SMSStatsCards';
import { SMSFilters } from './sms-analytics/SMSFilters';
import { SMSLogsTable } from './sms-analytics/SMSLogsTable';

export const SMSAnalytics: React.FC = () => {
  const {
    logs,
    stats,
    isLoading,
    filterStatus,
    setFilterStatus,
    filterPeriod,
    setFilterPeriod,
    loadSMSData,
    exportLogs
  } = useSMSAnalytics();

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

      <SMSStatsCards stats={stats} />

      {/* Filters and Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            SMS Logs
          </CardTitle>
          <SMSFilters
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterPeriod={filterPeriod}
            setFilterPeriod={setFilterPeriod}
          />
        </CardHeader>
        <CardContent>
          <SMSLogsTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
};
