
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MessageContentSectionProps {
  messageContent: string;
  setMessageContent: (value: string) => void;
}

export const MessageContentSection: React.FC<MessageContentSectionProps> = ({
  messageContent,
  setMessageContent
}) => {
  return (
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
  );
};
