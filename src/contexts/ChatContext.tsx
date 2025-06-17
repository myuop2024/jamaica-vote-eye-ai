/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { notifyChatEvent } from '@/services/notificationService';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

const generateUUID = () => crypto.randomUUID();

export interface ChatMessage {
  id: string;
  room: string;
  senderId: string;
  senderName: string;
  receiverId?: string;
  receiverName?: string;
  content: string;
  type: 'text' | 'file' | 'system';
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
    content: string,
    type?: 'text' | 'file',
    fileMeta?: { url: string; name: string },
    receiver?: { id: string; name: string }
  ) => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  currentRoom: string;
  onlineUsers: Record<string, { name: string; presence_ref: string }[]>;
  uploadFile: (file: File) => Promise<{ url: string; name: string }>;
  connectionStatus: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';
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
  const [currentRoom, setCurrentRoom] = useState<string>('');
  const [onlineUsers, setOnlineUsers] = useState<Record<string, { name: string; presence_ref: string }[]>>({});
  const [connectionStatus, setConnectionStatus] = useState<ChatContextType['connectionStatus']>('CLOSED');
  
  const channelRef = useRef<RealtimeChannel | null>(null);

  const handleIncomingMessage = useCallback((payload: any) => {
    const message = payload.message as ChatMessage;
    console.log(`Chat: Received message in room ${message.room}`, message);
    setMessages(prev => {
      if (prev.find(m => m.id === message.id)) return prev; // Deduplicate
      return [...prev, message];
    });
  }, []);

  const joinRoom = useCallback((room: string) => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      leaveRoom(); // Leave previous room
    }
    if (!user || !room) return;

    console.log(`Chat: Joining room ${room}`);
    const newChannel = supabase.channel(`room:${room}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = newChannel.presenceState();
        const users = (presenceState as unknown) as RealtimePresenceState<{name: string}>;
        console.log(`Chat: Presence sync in ${room}`, users);
        setOnlineUsers(users);
      })
      .on('broadcast', { event: 'message' }, (payload) => {
        handleIncomingMessage(payload.payload);
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Chat: Successfully subscribed to room ${room}`);
          setCurrentRoom(room);
          newChannel.track({ name: user.name || user.email });
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Chat: Failed to subscribe to room ${room}`, err);
          toast({
            title: 'Chat Connection Error',
            description: `Could not connect to room: ${room}.`,
            variant: 'destructive',
          });
        }
        setConnectionStatus(status);
      });

    channelRef.current = newChannel;
  }, [user, handleIncomingMessage]);

  const leaveRoom = useCallback(() => {
    if (channelRef.current) {
      console.log(`Chat: Leaving room ${channelRef.current.topic}`);
      channelRef.current.unsubscribe();
      channelRef.current = null;
      setCurrentRoom('');
      setOnlineUsers({});
      setMessages([]); // Clear messages on room change
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    return () => leaveRoom(); // Cleanup on unmount
  }, [leaveRoom]);

  const sendMessage = async (
    content: string,
    type: 'text' | 'file' = 'text',
    fileMeta?: { url: string; name: string },
    receiver?: { id: string; name: string }
  ) => {
    if (!user || !currentRoom || !channelRef.current || channelRef.current.state !== 'joined') {
      toast({ title: 'Cannot send message', description: 'You are not connected to a chat room.', variant: 'destructive' });
      return;
    }

    const msg: ChatMessage = {
      id: generateUUID(),
      room: currentRoom,
      senderId: user.id,
      senderName: user.name || user.email || 'Anonymous',
      receiverId: receiver?.id,
      receiverName: receiver?.name,
      content,
      type,
      fileUrl: fileMeta?.url,
      fileName: fileMeta?.name,
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages(prev => [...prev, msg]); // Optimistic UI update

    try {
      const result = await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: { message: { ...msg, status: 'sent' } },
      });

      if (result === 'ok') {
        console.log(`Chat: Message ${msg.id} sent successfully to room ${currentRoom}`);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent' } : m));
        await notifyChatEvent(user.id, 'chat_message_sent', `Message sent in ${currentRoom}`, { msgId: msg.id });
      } else {
        throw new Error('Broadcast failed');
      }
    } catch (error) {
      console.error(`Chat: Failed to send message ${msg.id} to room ${currentRoom}. Error:`, error);
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
      toast({ title: 'Message Failed', description: 'Could not send message. Please try again.', variant: 'destructive' });
    }
  };

  const uploadFile = async (file: File) => {
    if (!currentRoom) throw new Error('Cannot upload file without being in a room.');
    const filePath = `${currentRoom}/${user?.id}/${Date.now()}_${file.name}`;
    console.log(`Chat: Uploading file "${file.name}" to path "${filePath}".`);
    
    const { data, error } = await supabase.storage.from('chat-files').upload(filePath, file);
    if (error) {
      console.error('Chat: File upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from('chat-files').getPublicUrl(data.path);
    console.log(`Chat: File uploaded successfully. Public URL: ${publicUrl}`);
    return { url: publicUrl, name: file.name };
  };

  return (
    <ChatContext.Provider value={{
      messages,
      sendMessage,
      joinRoom,
      leaveRoom,
      currentRoom,
      onlineUsers,
      uploadFile,
      connectionStatus,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
