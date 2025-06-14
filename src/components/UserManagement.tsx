
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserManagementHeader } from './user-management/UserManagementHeader';
import { UserFilters } from './user-management/UserFilters';
import { UserBulkActions } from './user-management/UserBulkActions';
import { UserTable } from './user-management/UserTable';
import { UserEditDialog } from './user-management/UserEditDialog';
import { UserDetailsDialog } from './user-management/UserDetailsDialog';
import { useUserManagement } from './user-management/useUserManagement';

export const UserManagement: React.FC = () => {
  const {
    filteredUsers,
    selectedUsers,
    isLoading,
    searchTerm,
    roleFilter,
    statusFilter,
    stationFilter,
    dateFilter,
    selectedUser,
    isEditDialogOpen,
    isDetailsDialogOpen,
    setSearchTerm,
    setRoleFilter,
    setStatusFilter,
    setStationFilter,
    setDateFilter,
    setSelectedUser,
    setIsEditDialogOpen,
    setIsDetailsDialogOpen,
    handleBulkAction,
    handleUserSelection,
    clearSelection,
    clearFilters,
    getActiveFiltersCount,
    handleUpdateUserStatus,
    handleDeleteUser,
    handleSendMessage
  } = useUserManagement();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <UserManagementHeader />
        <CardContent className="space-y-6">
          <UserFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            stationFilter={stationFilter}
            onStationFilterChange={setStationFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            onClearFilters={clearFilters}
            activeFiltersCount={getActiveFiltersCount()}
          />

          <UserBulkActions
            selectedUsers={selectedUsers}
            onBulkAction={handleBulkAction}
            onClearSelection={clearSelection}
          />

          <UserTable
            users={filteredUsers}
            selectedUsers={selectedUsers}
            onUserSelection={handleUserSelection}
            onEdit={(user) => {
              setSelectedUser(user);
              setIsEditDialogOpen(true);
            }}
            onDelete={handleDeleteUser}
            onViewDetails={(user) => {
              setSelectedUser(user);
              setIsDetailsDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>

      <UserEditDialog
        user={selectedUser}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdateStatus={handleUpdateUserStatus}
      />

      <UserDetailsDialog
        user={selectedUser}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onEdit={(user) => {
          setIsDetailsDialogOpen(false);
          setIsEditDialogOpen(true);
        }}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};
