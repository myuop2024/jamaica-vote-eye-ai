
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { notifyChatEvent } from '@/services/notificationService';

export interface ChatMessage {
  id: string;
  room: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  edited?: boolean;
  deleted?: boolean;
}

export interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (room: string, content: string, type?: 'text' | 'file', fileMeta?: { url: string; name: string }) => void;
  editMessage: (msgId: string, newContent: string) => void;
  deleteMessage: (msgId: string) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  currentRoom: string;
  onlineUsers: Record<string, string>; // userId -> name
  uploadFile: (file: File, room: string) => Promise<{ url: string; name: string }>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentRoom, setCurrentRoom] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const retryQueue = useRef<ChatMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Connect to chat WebSocket with error handling
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      try {
        const token = localStorage.getItem('jwt');
        const wsUrl = `${window.location.origin.replace('http', 'ws')}/api/chat/ws?room=${currentRoom}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        setConnectionStatus('connecting');

        ws.onopen = () => {
          console.log('WebSocket connected');
          setConnectionStatus('connected');
          if (token) {
            ws.send(JSON.stringify({ type: 'auth', token }));
          }
          if (currentRoom) {
            ws.send(JSON.stringify({ type: 'join', room: currentRoom }));
          }
          // Retry any queued messages
          retryQueue.current.forEach(msg => {
            try {
              ws.send(JSON.stringify(msg));
            } catch (error) {
              console.error('Failed to send queued message:', error);
            }
          });
          retryQueue.current = [];
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
              setMessages(prev => [...prev, data.message]);
            } else if (data.type === 'status') {
              // delivery/read/online status
              if (data.status === 'delivered' || data.status === 'read') {
                setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, status: data.status } : m));
              }
            } else if (data.type === 'online') {
              setOnlineUsers(data.users || {});
            } else if (data.type === 'edit') {
              setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, content: data.newContent, edited: true } : m));
            } else if (data.type === 'delete') {
              setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, deleted: true } : m));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('disconnected');
          toast({ 
            title: 'Chat connection error', 
            description: 'Unable to connect to chat service',
            variant: 'destructive' 
          });
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setConnectionStatus('disconnected');
          // Optionally auto-reconnect after a delay
          setTimeout(() => {
            if (user && currentRoom) {
              connectWebSocket();
            }
          }, 5000);
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus('disconnected');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, currentRoom]);

  const sendMessage = async (room: string, content: string, type: 'text' | 'file' = 'text', fileMeta?: { url: string; name: string }) => {
    if (!user) {
      console.error('Cannot send message: user not authenticated');
      return;
    }

    const msg: ChatMessage = {
      id: uuidv4(),
      room,
      senderId: user.id,
      senderName: user.name,
      content,
      type,
      fileUrl: fileMeta?.url,
      fileName: fileMeta?.name,
      timestamp: Date.now(),
      status: 'sending',
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, msg]);

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Queue for retry
      retryQueue.current.push({ ...msg, type: 'message', message: msg } as any);
      // Update status to failed after a delay
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
      }, 3000);
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({ type: 'message', message: msg }));
      // Update status to sent
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
      
      // Audit/notify
      if (user) {
        await notifyChatEvent(user.id, 'chat_message_sent', `Message sent in ${room}`, { msg });
        if (type === 'file' && fileMeta) {
          await notifyChatEvent(user.id, 'chat_file_uploaded', `File uploaded in ${room}: ${fileMeta.name}`, { file: fileMeta });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
    }
  };

  const editMessage = async (msgId: string, newContent: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'edit', msgId, newContent }));
        if (user) {
          await notifyChatEvent(user.id, 'chat_message_edited', `Message edited in ${currentRoom}`, { msgId });
        }
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  const deleteMessage = async (msgId: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'delete', msgId }));
        if (user) {
          await notifyChatEvent(user.id, 'chat_message_deleted', `Message deleted in ${currentRoom}`, { msgId });
        }
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const joinRoom = (room: string) => {
    setCurrentRoom(room);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'join', room }));
      } catch (error) {
        console.error('Failed to join room:', error);
      }
    }
  };

  const leaveRoom = (room: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave', room }));
      } catch (error) {
        console.error('Failed to leave room:', error);
      }
    }
    setCurrentRoom('');
  };

  const uploadFile = async (file: File, room: string) => {
    try {
      // Upload to Supabase Storage
      const filePath = `${room}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('chat-files').upload(filePath, file, { upsert: false });
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
      return { url: publicUrl, name: file.name };
    } catch (error) {
      console.error('File upload failed:', error);
      throw new Error('File upload failed. Please try again.');
    }
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      sendMessage, 
      editMessage, 
      deleteMessage, 
      joinRoom, 
      leaveRoom, 
      currentRoom, 
      onlineUsers, 
      uploadFile 
    }}>
      {children}
    </ChatContext.Provider>
  );
};
