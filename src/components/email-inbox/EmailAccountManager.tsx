
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Mail, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { useEmailAccounts } from './hooks/useEmailAccounts';
import { useToast } from '@/hooks/use-toast';

export const EmailAccountManager: React.FC = () => {
  const { accounts, isLoading, connectGmail, removeAccount } = useEmailAccounts();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGmail = async () => {
    try {
      setIsConnecting(true);
      await connectGmail();
      toast({
        title: "Success",
        description: "Gmail account connected successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect Gmail account",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemoveAccount = async (accountId: string) => {
    try {
      await removeAccount(accountId);
      toast({
        title: "Success",
        description: "Email account removed successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove email account",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Email Accounts</CardTitle>
          <CardDescription>
            Manage your connected Gmail accounts for email synchronization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConnectGmail}
            disabled={isConnecting}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Connect Gmail Account'}
          </Button>

          {accounts.length === 0 && !isLoading && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No email accounts connected. Connect a Gmail account to start managing emails.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{account.email_address}</p>
                        <p className="text-sm text-gray-500">
                          Provider: {account.provider}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={account.is_active ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {account.is_active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveAccount(account.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
