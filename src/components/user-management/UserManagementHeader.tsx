
import React, { useState } from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Download, Upload } from 'lucide-react';
import { AddUserDialog } from './AddUserDialog';
import { UserGoogleSheetsDialog } from './UserGoogleSheetsDialog';

interface UserManagementHeaderProps {
  onUserAdded?: () => void;
}

export const UserManagementHeader: React.FC<UserManagementHeaderProps> = ({ onUserAdded }) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [syncType, setSyncType] = useState<'export' | 'import'>('export');

  const handleUserAdded = () => {
    if (onUserAdded) {
      onUserAdded();
    }
  };

  const handleExport = () => {
    setSyncType('export');
    setIsGoogleSheetsOpen(true);
  };

  const handleImport = () => {
    setSyncType('import');
    setIsGoogleSheetsOpen(true);
  };

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and verification status
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>
      </CardHeader>

      <AddUserDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onUserAdded={handleUserAdded}
      />

      <UserGoogleSheetsDialog
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        syncType={syncType}
        onSyncComplete={handleUserAdded}
      />
    </>
  );
};
