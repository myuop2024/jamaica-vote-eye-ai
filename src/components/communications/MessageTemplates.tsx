
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { MESSAGE_TEMPLATES } from './types';

interface MessageTemplatesProps {
  onTemplateSelect: (template: string) => void;
}

export const MessageTemplates: React.FC<MessageTemplatesProps> = ({ onTemplateSelect }) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Templates</CardTitle>
        <CardDescription>
          Quick templates for common communications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(MESSAGE_TEMPLATES).map(([type, typeTemplates]) => (
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
                    onClick={() => onTemplateSelect(template)}
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
  );
};
