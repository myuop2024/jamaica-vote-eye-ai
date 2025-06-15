
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CampaignForm } from './communications/CampaignForm';
import { CampaignHistory } from './communications/CampaignHistory';
import { MessageTemplates } from './communications/MessageTemplates';
import { CommunicationAnalytics } from './communications/CommunicationAnalytics';
import { useCommunications } from './communications/useCommunications';

export const EnhancedCommunicationsManager: React.FC = () => {
  const { communications, isLoading, refetchCommunications } = useCommunications();
  const [activeTab, setActiveTab] = useState('campaigns');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setActiveTab('campaigns');
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
          <CampaignForm 
            onCampaignSent={refetchCommunications}
            selectedTemplate={selectedTemplate}
            onTemplateUsed={() => setSelectedTemplate('')}
          />
          <CampaignHistory communications={communications} />
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <MessageTemplates onTemplateSelect={handleTemplateSelect} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <CommunicationAnalytics communications={communications} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
