
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MailOpen, Search, RefreshCw, Paperclip } from 'lucide-react';
import { useEmailMessages } from './hooks/useEmailMessages';
import { EmailMessage } from './types';

interface EmailMessageListProps {
  type: 'inbox' | 'sent';
  accounts: any[];
}

export const EmailMessageList: React.FC<EmailMessageListProps> = ({ type, accounts }) => {
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);

  const { 
    messages, 
    isLoading, 
    isSyncing,
    markAsRead, 
    syncMessages 
  } = useEmailMessages(selectedAccount === 'all' ? undefined : selectedAccount, type);

  const filteredMessages = messages.filter(message =>
    message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.from_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMessageClick = async (message: EmailMessage) => {
    setSelectedMessage(message);
    if (!message.is_read && type === 'inbox') {
      await markAsRead(message.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No email accounts connected</p>
          <p className="text-sm text-gray-500 mt-1">
            Connect a Gmail account to view messages
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.email_address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={() => syncMessages()}
              disabled={isLoading || isSyncing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{type === 'inbox' ? 'Inbox' : 'Sent'} ({filteredMessages.length})</span>
              {isSyncing && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Syncing
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-6 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages found</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try syncing your emails or connecting more accounts
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageClick(message)}
                    className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                      selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                    } ${!message.is_read && type === 'inbox' ? 'font-medium' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!message.is_read && type === 'inbox' ? (
                            <Mail className="w-4 h-4 text-blue-600" />
                          ) : (
                            <MailOpen className="w-4 h-4 text-gray-400" />
                          )}
                          {message.has_attachments && (
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {type === 'inbox' ? 
                            (message.from_name || message.from_email) : 
                            'To: ' + (message.to_emails as string[])?.[0]
                          }
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {message.subject || '(No subject)'}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(message.received_at || message.sent_at || message.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Content */}
        <Card>
          <CardHeader>
            <CardTitle>Message Content</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMessage ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{selectedMessage.subject || '(No subject)'}</h4>
                  <p className="text-sm text-gray-600">
                    From: {selectedMessage.from_name || selectedMessage.from_email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedMessage.received_at || selectedMessage.sent_at || selectedMessage.created_at)}
                  </p>
                </div>
                <div className="border-t pt-4">
                  {selectedMessage.body_html ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                      className="prose prose-sm max-w-none"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm">
                      {selectedMessage.body_text || 'No content available'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p>Select a message to view its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
