
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Settings, Inbox, Send } from 'lucide-react';
import { EmailAccountManager } from './EmailAccountManager';
import { EmailMessageList } from './EmailMessageList';
import { useEmailAccounts } from './hooks/useEmailAccounts';

export const EmailInbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const { accounts, isLoading } = useEmailAccounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Management
          </CardTitle>
          <CardDescription>
            Manage email accounts and view messages
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="w-4 h-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Accounts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox">
          <EmailMessageList type="inbox" accounts={accounts} />
        </TabsContent>

        <TabsContent value="sent">
          <EmailMessageList type="sent" accounts={accounts} />
        </TabsContent>

        <TabsContent value="accounts">
          <EmailAccountManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
