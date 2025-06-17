
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { notifyChatEvent } from '@/services/notificationService';

// Generate UUID using crypto API instead of uuid package
const generateUUID = () => {
  return crypto.randomUUID();
};

export interface ChatMessage {
  id: string;
  room: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
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
  sendMessage: (
    room: string,
    content: string,
    type?: 'text' | 'file',
    fileMeta?: { url: string; name: string },
    receiver?: { id: string; name: string }
  ) => void;
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
  const retryQueue = useRef<{ type: 'message'; message: ChatMessage }[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  // Load messages from localStorage on init
  useEffect(() => {
    const savedMessages = localStorage.getItem('chat-messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Failed to load saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem('chat-messages', JSON.stringify(messages));
  }, [messages]);

  // Connect to chat WebSocket with fallback to localStorage
  useEffect(() => {
    if (!user) return;
    
    const connectWebSocket = () => {
      try {
        const token = localStorage.getItem('jwt');
        
        // Try different WebSocket URLs
        const wsUrls = [
          `${window.location.origin.replace('http', 'ws')}/api/chat/ws?room=${currentRoom}&token=${encodeURIComponent(token || '')}`,
          `ws://localhost:9092`, // Direct connection to tl-rtc-file
          `wss://localhost:9092`
        ];

        let wsIndex = 0;
        
        const tryConnect = () => {
          if (wsIndex >= wsUrls.length) {
            console.log('All WebSocket URLs failed, using localStorage fallback');
            setUseLocalStorage(true);
            setConnectionStatus('disconnected');
            toast({ 
              title: 'Chat Offline Mode', 
              description: 'Using local storage for messages. Real-time features unavailable.',
              variant: 'default'
            });
            return;
          }

          const wsUrl = wsUrls[wsIndex];
          console.log(`Attempting to connect to: ${wsUrl}`);
          
          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;
          setConnectionStatus('connecting');

          ws.onopen = () => {
            console.log('WebSocket connected to:', wsUrl);
            setConnectionStatus('connected');
            setUseLocalStorage(false);
            
            if (token) {
              ws.send(JSON.stringify({ type: 'auth', token }));
            }
            if (currentRoom) {
              ws.send(JSON.stringify({ type: 'join', room: currentRoom, userId: user.id, userName: user.name }));
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
            console.error(`WebSocket error for ${wsUrl}:`, error);
            ws.close();
          };

          ws.onclose = () => {
            console.log(`WebSocket disconnected from: ${wsUrl}`);
            setConnectionStatus('disconnected');
            
            // Try next URL
            wsIndex++;
            setTimeout(tryConnect, 1000);
          };
        };

        tryConnect();
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setConnectionStatus('disconnected');
        setUseLocalStorage(true);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, currentRoom]);

  const sendMessage = async (
    room: string,
    content: string,
    type: 'text' | 'file' = 'text',
    fileMeta?: { url: string; name: string },
    receiver?: { id: string; name: string }
  ) => {
    if (!user) {
      console.error('Cannot send message: user not authenticated');
      return;
    }

    const msg: ChatMessage = {
      id: generateUUID(),
      room,
      senderId: user.id,
      senderName: user.name,
      receiverId: receiver?.id,
      receiverName: receiver?.name,
      content,
      type,
      fileUrl: fileMeta?.url,
      fileName: fileMeta?.name,
      timestamp: Date.now(),
      status: 'sending',
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, msg]);

    if (useLocalStorage || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      // Store locally when offline
      setTimeout(() => {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
      }, 500);
      
      if (!useLocalStorage) {
        // Queue for retry when connection comes back
        retryQueue.current.push({ type: 'message', message: msg });
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
        }, 3000);
      }
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({ type: 'message', message: msg }));
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
      
      // Audit/notify
      if (user) {
        await notifyChatEvent(user.id, 'chat_message_sent', `Message sent in ${room}`, { msg });
        if (receiver) {
          await notifyChatEvent(user.id, 'chat_direct_message', `Direct message to ${receiver.name}`, { msg });
        }
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
    if (useLocalStorage) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newContent, edited: true } : m));
      return;
    }

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
    if (useLocalStorage) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted: true } : m));
      return;
    }

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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'join', room, userId: user.id, userName: user.name }));
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
