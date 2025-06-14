
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users } from 'lucide-react';
import { UserTableRow } from './UserTableRow';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  phone_number?: string;
  assigned_station?: string;
  created_at: string;
  last_login?: string;
}

interface UserTableProps {
  users: UserProfile[];
  selectedUsers: string[];
  onUserSelection: (userId: string, selected: boolean) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
  onViewDetails: (user: UserProfile) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  selectedUsers,
  onUserSelection,
  onEdit,
  onDelete,
  onViewDetails
}) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No users found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserTableRow
              key={user.id}
              user={user}
              isSelected={selectedUsers.includes(user.id)}
              onSelect={onUserSelection}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
