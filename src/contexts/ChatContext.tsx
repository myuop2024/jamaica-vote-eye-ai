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

  // Connect to chat WebSocket
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('jwt');
    const ws = new WebSocket(`${window.location.origin.replace('http', 'ws')}/api/chat/ws?room=${currentRoom}`);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', token }));
      if (currentRoom) ws.send(JSON.stringify({ type: 'join', room: currentRoom }));
      // Retry any queued messages
      retryQueue.current.forEach(msg => ws.send(JSON.stringify(msg)));
      retryQueue.current = [];
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'status') {
        // delivery/read/online status
        if (data.status === 'delivered' || data.status === 'read') {
          setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, status: data.status } : m));
        }
      } else if (data.type === 'online') {
        setOnlineUsers(data.users);
      } else if (data.type === 'edit') {
        setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, content: data.newContent, edited: true } : m));
      } else if (data.type === 'delete') {
        setMessages(prev => prev.map(m => m.id === data.msgId ? { ...m, deleted: true } : m));
      }
    };
    ws.onerror = () => {
      toast({ title: 'Chat connection error', variant: 'destructive' });
    };
    ws.onclose = () => {
      // Optionally auto-reconnect
    };
    return () => ws.close();
  }, [user, currentRoom]);

  const sendMessage = async (room: string, content: string, type: 'text' | 'file' = 'text', fileMeta?: { url: string; name: string }) => {
    if (!wsRef.current || wsRef.current.readyState !== 1 || !user) {
      // Queue for retry
      const msg: ChatMessage = {
        id: uuidv4(),
        room,
        senderId: user?.id,
        senderName: user?.name,
        content,
        type,
        fileUrl: fileMeta?.url,
        fileName: fileMeta?.name,
        timestamp: Date.now(),
        status: 'sending',
      };
      retryQueue.current.push(msg);
      setMessages(prev => [...prev, msg]);
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
      status: 'sent',
    };
    wsRef.current.send(JSON.stringify({ type: 'message', message: msg }));
    setMessages(prev => [...prev, msg]);
    // Audit/notify
    await notifyChatEvent(user.id, 'chat_message_sent', `Message sent in ${room}`, { msg });
    if (type === 'file' && fileMeta) {
      await notifyChatEvent(user.id, 'chat_file_uploaded', `File uploaded in ${room}: ${fileMeta.name}`, { file: fileMeta });
    }
  };

  const editMessage = async (msgId: string, newContent: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'edit', msgId, newContent }));
    if (user) await notifyChatEvent(user.id, 'chat_message_edited', `Message edited in ${currentRoom}`, { msgId });
  };

  const deleteMessage = async (msgId: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'delete', msgId }));
    if (user) await notifyChatEvent(user.id, 'chat_message_deleted', `Message deleted in ${currentRoom}`, { msgId });
  };

  const joinRoom = (room: string) => {
    setCurrentRoom(room);
    wsRef.current?.send(JSON.stringify({ type: 'join', room }));
  };

  const leaveRoom = (room: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'leave', room }));
    setCurrentRoom('');
  };

  const uploadFile = async (file: File, room: string) => {
    // Upload to Supabase Storage
    const filePath = `${room}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('chat-files').upload(filePath, file, { upsert: false });
    if (error) throw error;
    const { publicURL } = supabase.storage.from('chat-files').getPublicUrl(filePath).data;
    return { url: publicURL, name: file.name };
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, editMessage, deleteMessage, joinRoom, leaveRoom, currentRoom, onlineUsers, uploadFile }}>
      {children}
    </ChatContext.Provider>
  );
}; 