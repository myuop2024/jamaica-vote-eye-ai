
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare
} from 'lucide-react';
import { SMSLog } from './types';

interface SMSLogsTableProps {
  logs: SMSLog[];
}

export const SMSLogsTable: React.FC<SMSLogsTableProps> = ({ logs }) => {
  const getStatusBadge = (log: SMSLog) => {
    if (log.error_message) {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    } else if (log.delivered_at) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  return (
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

      {logs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No SMS logs found for the selected filters</p>
        </div>
      )}
    </div>
  );
};
