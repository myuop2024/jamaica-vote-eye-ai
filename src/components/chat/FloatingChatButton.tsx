import React, { useState } from 'react';
import { ChatWindow } from './ChatWindow';
import { useChat } from '@/contexts/ChatContext';

export const FloatingChatButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { messages, currentRoom } = useChat();
  const unread = messages.filter(m => m.room === currentRoom && m.status !== 'read' && m.senderId !== 'me').length;

  return (
    <>
      <button
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full shadow-lg w-16 h-16 flex items-center justify-center text-2xl z-50"
        onClick={() => setOpen(v => !v)}
        aria-label="Open chat"
      >
        💬
        {unread > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white rounded-full px-2 text-xs">{unread}</span>
        )}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[400px] max-w-full">
          <ChatWindow />
        </div>
      )}
    </>
  );
}; 