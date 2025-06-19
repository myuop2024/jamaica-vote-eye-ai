import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageSquare, Send, Users, Calendar, CheckCircle } from 'lucide-react';
import { createNotification } from '@/services/notificationService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Communication {
  id: string;
  campaign_name: string;
  message_content: string;
  communication_type: 'sms' | 'whatsapp' | 'email';
  target_audience: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  sent_at?: string;
}

export const CommunicationsManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [communicationType, setCommunicationType] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [targetAudience, setTargetAudience] = useState('all');

  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifAudience, setNotifAudience] = useState('all');
  const [notifSending, setNotifSending] = useState(false);

  useEffect(() => {
    fetchCommunications();
  }, []);

  const fetchCommunications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('communications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommunications(data || []);
    } catch (error: any) {
      console.error('Error fetching communications:', error);
      toast({
        title: "Error",
        description: "Failed to load communications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createCommunication = async () => {
    if (!campaignName || !messageContent || !user?.id) return;

    try {
      setIsCreating(true);
      const { error } = await supabase
        .from('communications')
        .insert({
          campaign_name: campaignName,
          message_content: messageContent,
          communication_type: communicationType,
          target_audience: targetAudience,
          sent_by: user.id,
          status: 'pending'
        });

      if (error) throw error;

      // Fetch target users for notification
      let userQuery = supabase.from('profiles').select('id');
      if (targetAudience === 'verified') {
        userQuery = userQuery.eq('verification_status', 'verified');
      } else if (targetAudience === 'pending') {
        userQuery = userQuery.eq('verification_status', 'pending');
      } // For 'all' and 'specific_stations', adjust as needed
      const { data: users, error: userError } = await userQuery;
      if (!userError && users) {
        for (const u of users) {
          await createNotification(
            u.id,
            'admin_message',
            campaignName,
            messageContent
          );
        }
      }

      toast({
        title: "Success",
        description: "Communication campaign created successfully"
      });

      // Reset form
      setCampaignName('');
      setMessageContent('');
      setCommunicationType('sms');
      setTargetAudience('all');

      fetchCommunications();
    } catch (error: any) {
      console.error('Error creating communication:', error);
      toast({
        title: "Error",
        description: "Failed to create communication campaign",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      sms: 'bg-purple-100 text-purple-800',
      whatsapp: 'bg-green-100 text-green-800',
      email: 'bg-blue-100 text-blue-800'
    };
    return variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const handleSendSiteNotification = async () => {
    setNotifSending(true);
    try {
      let userQuery = supabase.from('profiles').select('id');
      if (notifAudience === 'verified') {
        userQuery = userQuery.eq('verification_status', 'verified');
      } else if (notifAudience === 'pending') {
        userQuery = userQuery.eq('verification_status', 'pending');
      }
      const { data: users, error: userError } = await userQuery;
      if (!userError && users) {
        for (const u of users) {
          await createNotification(
            u.id,
            'site_notice',
            notifTitle,
            notifMessage
          );
        }
      }
      toast({ title: 'Notification Sent', description: 'Site notification sent to users.' });
      setShowNotifModal(false);
      setNotifTitle('');
      setNotifMessage('');
      setNotifAudience('all');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send notification', variant: 'destructive' });
    } finally {
      setNotifSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => setShowNotifModal(true)}>
          Send Site Notification
        </Button>
      </div>
      <Dialog open={showNotifModal} onOpenChange={setShowNotifModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Site Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Notification Title"
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
            />
            <Textarea
              placeholder="Notification Message"
              value={notifMessage}
              onChange={e => setNotifMessage(e.target.value)}
              rows={4}
            />
            <Select value={notifAudience} onValueChange={setNotifAudience}>
              <SelectTrigger>
                <SelectValue placeholder="Select Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">Verified Users</SelectItem>
                <SelectItem value="pending">Pending Users</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNotifModal(false)} disabled={notifSending}>Cancel</Button>
              <Button onClick={handleSendSiteNotification} disabled={notifSending || !notifTitle || !notifMessage}>
                {notifSending ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Create Communication Campaign
          </CardTitle>
          <CardDescription>
            Send messages to observers via SMS, WhatsApp, or Email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g., Pre-Election Reminder"
              />
            </div>
            <div>
              <Label htmlFor="communicationType">Communication Type</Label>
              <Select value={communicationType} onValueChange={(value: any) => setCommunicationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Select value={targetAudience} onValueChange={setTargetAudience}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Observers</SelectItem>
                <SelectItem value="verified">Verified Observers Only</SelectItem>
                <SelectItem value="pending">Pending Verification</SelectItem>
                <SelectItem value="specific_stations">Specific Stations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="messageContent">Message Content</Label>
            <Textarea
              id="messageContent"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Enter your message here..."
              rows={4}
            />
            <div className="text-sm text-gray-500 mt-1">
              {messageContent.length} characters
            </div>
          </div>

          <Button 
            onClick={createCommunication}
            disabled={isCreating || !campaignName || !messageContent}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 mr-2" />
                Create Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Communications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Communication History
          </CardTitle>
          <CardDescription>
            View all communication campaigns and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Statistics</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {communications.map((comm) => (
                  <TableRow key={comm.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{comm.campaign_name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[200px]">
                          {comm.message_content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadge(comm.communication_type)}>
                        {comm.communication_type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{comm.target_audience.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(comm.status)}>
                        {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Sent: {comm.sent_count}</div>
                        <div>Delivered: {comm.delivered_count}</div>
                        {comm.failed_count > 0 && (
                          <div className="text-red-600">Failed: {comm.failed_count}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(comm.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {communications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No communication campaigns found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
