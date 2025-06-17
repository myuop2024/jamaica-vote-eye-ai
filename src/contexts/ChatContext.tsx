
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
        const proxyWsUrl = `${window.location.origin.replace('http', 'ws')}/api/chat/ws?room=${currentRoom}&token=${encodeURIComponent(token || '')}`;

        console.log(`Chat: Attempting WebSocket connection to proxy: ${proxyWsUrl}`);
        const ws = new WebSocket(proxyWsUrl);
        wsRef.current = ws;
        setConnectionStatus('connecting');
        let connectionEstablished = false; // Flag to track if onopen was called

        ws.onopen = () => {
          connectionEstablished = true;
          console.log('Chat: WebSocket connected to proxy:', proxyWsUrl);
          setConnectionStatus('connected');
          setUseLocalStorage(false);

          if (token) {
            ws.send(JSON.stringify({ type: 'auth', token }));
          }
          if (currentRoom) {
            ws.send(JSON.stringify({ type: 'join', room: currentRoom, userId: user.id, userName: user.name }));
          }

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
              console.log(`ChatContext: Received message ${data.message.id} in room ${data.message.room}. Type: ${data.message.type}, Sender: ${data.message.senderName}`);
              setMessages(prev => [...prev, data.message]);
            } else if (data.type === 'status') {
              console.log(`ChatContext: Status update for message ${data.msgId}. New status: ${data.status}`);
              if (data.status === 'delivered' || data.status === 'read') {
                setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, status: data.status } : m));
              }
            } else if (data.type === 'online') {
              console.log('ChatContext: Online users updated:', data.users);
              setOnlineUsers(data.users || {});
            } else if (data.type === 'edit') {
              console.log(`ChatContext: Message ${data.msgId} was edited remotely.`);
              setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, content: data.newContent, edited: true } : m));
            } else if (data.type === 'delete') {
              console.log(`ChatContext: Message ${data.msgId} was deleted remotely.`);
              setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, deleted: true } : m));
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onerror = (errorEvent) => { // errorEvent is of type Event
          console.error('Chat: WebSocket error with proxy:', proxyWsUrl, errorEvent);
          // ws.close() will often be called automatically, triggering onclose.
        };

        ws.onclose = (closeEvent) => { // closeEvent is of type CloseEvent
          console.log('Chat: WebSocket disconnected from proxy:', proxyWsUrl, 'Code:', closeEvent.code, 'Reason:', closeEvent.reason, 'Clean:', closeEvent.wasClean);
          setConnectionStatus('disconnected');

          if (!connectionEstablished || !closeEvent.wasClean) {
            console.log('Chat: WebSocket connection to proxy failed or closed unexpectedly. Falling back to localStorage mode.');
            setUseLocalStorage(true);
            toast({
              title: 'Chat Offline Mode',
              description: 'Using local storage for messages. Real-time features unavailable.',
              variant: 'default'
            });
          }
        };
      } catch (error) {
        console.error('Chat: Failed to create WebSocket connection:', error);
        setConnectionStatus('disconnected');
        setUseLocalStorage(true);
        toast({
            title: 'Chat Connection Error',
            description: 'Could not initiate chat connection. Using offline mode.',
            variant: 'destructive'
        });
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

    console.log(`ChatContext: Attempting to send message ${msg.id} to room ${room}. Type: ${msg.type}, Receiver: ${msg.receiverName || 'N/A'}`);
    if (useLocalStorage || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.log(`ChatContext: WebSocket not open. Message ${msg.id} will be handled by localStorage/queue. useLocalStorage: ${useLocalStorage}`);
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
      console.log(`ChatContext: Message ${msg.id} sent successfully via WebSocket to room ${room}.`);
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
      console.error(`ChatContext: Failed to send message ${msg.id} via WebSocket. Error:`, error);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
    }
  };

  const editMessage = async (msgId: string, newContent: string) => {
    console.log(`ChatContext: Attempting to edit message ${msgId} in room ${currentRoom}.`);
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
        console.error(`ChatContext: Failed to send edit for message ${msgId}. Error:`, error);
      }
    }
  };

  const deleteMessage = async (msgId: string) => {
    console.log(`ChatContext: Attempting to delete message ${msgId} in room ${currentRoom}.`);
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
        console.error(`ChatContext: Failed to send delete for message ${msgId}. Error:`, error);
      }
    }
  };

  const joinRoom = (room: string) => {
    console.log(`ChatContext: User ${user?.id} attempting to join room: ${room}. Current WebSocket state: ${wsRef.current?.readyState}`);
    setCurrentRoom(room);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && user) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'join', room, userId: user.id, userName: user.name }));
      } catch (error) {
        console.error(`ChatContext: Failed to send join message for room ${room}. Error:`, error);
      }
    }
  };

  const leaveRoom = (room: string) => {
    console.log(`ChatContext: User ${user?.id} attempting to leave room: ${room}. Current WebSocket state: ${wsRef.current?.readyState}`);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave', room }));
      } catch (error) {
        console.error(`ChatContext: Failed to send leave message for room ${room}. Error:`, error);
      }
    }
    setCurrentRoom('');
  };

  const uploadFile = async (file: File, room: string) => {
    const filePath = `${room}/${Date.now()}_${file.name}`;
    console.log(`ChatContext: Attempting to upload file "${file.name}" to room "${room}", path: "${filePath}".`);
    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from('chat-files').upload(filePath, file, { upsert: false });
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(filePath);
      console.log(`ChatContext: File "${file.name}" uploaded successfully to room "${room}". Public URL: ${publicUrl}`);
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
