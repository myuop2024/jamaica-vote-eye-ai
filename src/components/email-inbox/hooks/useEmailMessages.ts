
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { EmailMessage } from '../types';

export const useEmailMessages = (accountId?: string, type: 'inbox' | 'sent' = 'inbox') => {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setMessages([]);
        return;
      }

      let query = supabase
        .from('email_messages')
        .select(`
          *,
          email_accounts!inner(email_address, user_id)
        `)
        .eq('is_sent', type === 'sent')
        .eq('email_accounts.user_id', user.id)
        .order('received_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('email_account_id', accountId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('email_messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const syncMessages = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // This would typically call Gmail API to sync messages
      // For now, we'll create some mock messages for demonstration
      const { data: accounts } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('is_active', true)
        .eq('user_id', user.id);

      if (!accounts || accounts.length === 0) {
        toast({
          title: "Info",
          description: "No active email accounts to sync",
          variant: "default"
        });
        return;
      }

      const mockMessages = [
        {
          email_account_id: accounts[0].id,
          message_id: `msg_${Date.now()}_1`,
          subject: 'Welcome to Electoral Management System',
          from_email: 'notifications@electoral.gov.jm',
          from_name: 'Electoral Commission',
          to_emails: ['admin@electoral.gov.jm'],
          body_text: 'Welcome to the Electoral Management System. Your account has been set up successfully.',
          is_read: false,
          is_sent: type === 'sent',
          received_at: new Date().toISOString()
        },
        {
          email_account_id: accounts[0].id,
          message_id: `msg_${Date.now()}_2`,
          subject: 'System Update Notification',
          from_email: 'system@electoral.gov.jm',
          from_name: 'System Administrator',
          to_emails: ['admin@electoral.gov.jm'],
          body_text: 'The system has been updated with new features. Please review the changes.',
          is_read: false,
          is_sent: type === 'sent',
          received_at: new Date(Date.now() - 3600000).toISOString()
        }
      ];

      const { error } = await supabase
        .from('email_messages')
        .upsert(mockMessages, { onConflict: 'email_account_id,message_id' });

      if (error) throw error;

      await fetchMessages();
      
      toast({
        title: "Success",
        description: "Messages synced successfully"
      });
    } catch (error: any) {
      console.error('Error syncing messages:', error);
      toast({
        title: "Error",
        description: "Failed to sync messages",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    } else {
      setIsLoading(false);
      setMessages([]);
    }
  }, [accountId, type, user]);

  return {
    messages,
    isLoading,
    fetchMessages,
    markAsRead,
    syncMessages
  };
};
