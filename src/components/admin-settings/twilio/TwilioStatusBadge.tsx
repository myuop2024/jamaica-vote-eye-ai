
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { ConnectionStatus } from './types';

interface TwilioStatusBadgeProps {
  status: ConnectionStatus;
}

export const TwilioStatusBadge: React.FC<TwilioStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'connected':
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Error
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};
