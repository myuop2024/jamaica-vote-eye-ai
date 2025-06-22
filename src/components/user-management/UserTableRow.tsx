
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { User } from '@/types/auth';

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onViewDetails: (user: User) => void;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({
  user,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      verified: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <TableRow className={isSelected ? 'bg-blue-50' : ''}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(user.id, !!checked)}
        />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{user.name}</div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Mail className="w-3 h-3" />
            {user.email}
          </div>
          {user.phoneNumber && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Phone className="w-3 h-3" />
              {user.phoneNumber}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`${getRoleBadge(user.role)} border`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={`${getStatusBadge(user.verificationStatus)} border`}>
          {user.verificationStatus.charAt(0).toUpperCase() + user.verificationStatus.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        {user.assignedStation ? (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="w-3 h-3 text-gray-400" />
            {user.assignedStation}
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(user)}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="h-8 w-8 p-0"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
