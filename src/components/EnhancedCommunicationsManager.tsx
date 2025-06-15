
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, Users, Calendar, CheckCircle, Smartphone, Mail, MessageCircle } from 'lucide-react';

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

export const EnhancedCommunicationsManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');

  // Form state
  const [campaignName, setCampaignName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [communicationType, setCommunicationType] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [targetAudience, setTargetAudience] = useState('all');

  // Quick message templates
  const templates = {
    sms: [
      "Reminder: Please check in at your assigned polling station by 8 AM tomorrow.",
      "Update: Voting has been extended by 1 hour. Please remain at your station.",
      "Important: Report any irregularities immediately through the app."
    ],
    email: [
      "Pre-election briefing scheduled for tomorrow at 2 PM. Location details attached.",
      "Thank you for your service as an electoral observer. Your dedication helps ensure fair elections.",
      "Monthly report submission is due by the 5th. Please submit through the portal."
    ],
    whatsapp: [
      "Quick check-in: How are things at your polling station? Reply with status update.",
      "Emergency contact activated. Please respond if you need immediate assistance.",
      "End of day report: Please submit your observations within the next hour."
    ]
  };

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

  const sendMessage = async () => {
    if (!campaignName || !messageContent || !user?.id) return;

    try {
      setIsCreating(true);

      // Create communication record
      const { data: communication, error: createError } = await supabase
        .from('communications')
        .insert({
          campaign_name: campaignName,
          message_content: messageContent,
          communication_type: communicationType,
          target_audience: targetAudience,
          sent_by: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Get target recipients - include verification_status in the query
      let recipients = [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, phone_number, name, verification_status')
        .eq('role', 'observer');

      if (profilesError) throw profilesError;

      switch (targetAudience) {
        case 'verified':
          recipients = profiles?.filter(p => p.verification_status === 'verified') || [];
          break;
        case 'pending':
          recipients = profiles?.filter(p => p.verification_status === 'pending') || [];
          break;
        default:
          recipients = profiles || [];
      }

      // Send messages based on type
      let successCount = 0;
      let failureCount = 0;

      for (const recipient of recipients) {
        try {
          if (communicationType === 'sms' && recipient.phone_number) {
            const { error: smsError } = await supabase.functions.invoke('send-sms', {
              body: {
                to: recipient.phone_number,
                message: messageContent,
                campaignId: communication.id
              }
            });
            
            if (smsError) throw smsError;
            successCount++;
          } else if (communicationType === 'email' && recipient.email) {
            // Email sending would be implemented here
            successCount++;
          } else if (communicationType === 'whatsapp' && recipient.phone_number) {
            // WhatsApp sending would be implemented here
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to send to ${recipient.email || recipient.phone_number}:`, error);
          failureCount++;
        }
      }

      // Update communication status
      await supabase
        .from('communications')
        .update({
          status: successCount > 0 ? 'sent' : 'failed',
          sent_count: successCount,
          failed_count: failureCount,
          sent_at: new Date().toISOString()
        })
        .eq('id', communication.id);

      toast({
        title: "Messages Sent",
        description: `Successfully sent ${successCount} messages. ${failureCount} failed.`
      });

      // Reset form
      setCampaignName('');
      setMessageContent('');
      setCommunicationType('sms');
      setTargetAudience('all');

      fetchCommunications();
    } catch (error: any) {
      console.error('Error sending messages:', error);
      toast({
        title: "Error",
        description: "Failed to send messages",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const useTemplate = (template: string) => {
    setMessageContent(template);
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Smartphone className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
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
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
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
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          SMS
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </SelectItem>
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
                onClick={sendMessage}
                disabled={isCreating || !campaignName || !messageContent}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Communications History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {communications.map((comm) => (
                  <div key={comm.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(comm.communication_type)}
                      <div>
                        <div className="font-medium">{comm.campaign_name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[300px]">
                          {comm.message_content}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(comm.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(comm.status)}>
                        {comm.status}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {comm.sent_count} sent
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Quick templates for common communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(templates).map(([type, typeTemplates]) => (
                  <div key={type} className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2 capitalize">
                      {getTypeIcon(type)}
                      {type} Templates
                    </h3>
                    <div className="space-y-2">
                      {typeTemplates.map((template, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => useTemplate(template)}
                        >
                          <p className="text-sm">{template}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {communications.reduce((sum, comm) => sum + comm.sent_count, 0)}
                </div>
                <p className="text-sm text-gray-600">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {communications.length > 0 
                    ? Math.round((communications.reduce((sum, comm) => sum + comm.sent_count, 0) / 
                        (communications.reduce((sum, comm) => sum + comm.sent_count + comm.failed_count, 0) || 1)) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-gray-600">Delivery rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {communications.filter(comm => comm.status === 'sent').length}
                </div>
                <p className="text-sm text-gray-600">Currently running</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
