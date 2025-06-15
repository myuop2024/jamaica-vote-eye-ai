
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SMSFiltersProps {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterPeriod: string;
  setFilterPeriod: (period: string) => void;
}

export const SMSFilters: React.FC<SMSFiltersProps> = ({
  filterStatus,
  setFilterStatus,
  filterPeriod,
  setFilterPeriod
}) => {
  return (
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
  );
};
