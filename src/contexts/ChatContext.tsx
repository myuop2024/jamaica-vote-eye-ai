/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { notifyChatEvent } from '@/services/notificationService';
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_CHAT_ENCRYPTION_KEY || 'fallback_encryption_key_for_development';

function encryptMessage(message: string): string {
  if (!message) return '';
  try {
    return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return message; // Fallback to unencrypted
  }
}

function decryptMessage(ciphertext: string, messageId?: string): string {
  if (!ciphertext) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (decrypted === '' && ciphertext !== '') {
      console.warn(`Decryption resulted in empty string for messageId: ${messageId || 'N/A'}`);
      return '[Message Content Error]';
    }
    return decrypted;
  } catch (error) {
    console.error(`Decryption failed for messageId: ${messageId || 'N/A'}`, error);
    return '[Message Undecryptable]';
  }
}

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
  deleteMessage: (messageId: string) => void;
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
    const eventType = payload.event;
    const messageData = payload.message as ChatMessage;

    if (eventType === 'message') {
      const decryptedContent = decryptMessage(messageData.content, messageData.id);
      const decryptedMessage = { ...messageData, content: decryptedContent };
      
      console.log(`Chat: Received message in room ${decryptedMessage.room}`, decryptedMessage);
      setMessages(prev => {
        if (prev.find(m => m.id === decryptedMessage.id)) return prev;
        return [...prev, decryptedMessage];
      });
    } else if (eventType === 'delete') {
      const { messageId } = payload;
      console.log(`Chat: Received delete event for message ${messageId}`);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: '[This message has been deleted]', deleted: true, type: 'system' } : m
      ));
    }
  }, []);

  const joinRoom = useCallback((room: string) => {
    if (channelRef.current && channelRef.current.state === 'joined') {
      leaveRoom(); // Leave previous room
    }
    if (!user || !room) return;

    console.log(`Chat: Joining room ${room}`);

    // Fetch historical messages
    const fetchHistory = async () => {
      console.log(`Chat: Fetching history for room ${room}`);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room', room)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Chat: Error fetching history:', error);
        toast({ title: 'Error', description: 'Could not fetch chat history.', variant: 'destructive' });
      } else {
        const historicalMessages = data.map(msg => ({
          ...msg,
          content: msg.deleted ? msg.content : decryptMessage(msg.content, msg.id),
          timestamp: new Date(msg.created_at).getTime(),
          status: 'sent',
        })).reverse(); // Reverse to show oldest first
        setMessages(historicalMessages);
      }
    };
    
    fetchHistory();

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
        handleIncomingMessage({ ...payload.payload, event: 'message' });
      })
      .on('broadcast', { event: 'delete' }, (payload) => {
        handleIncomingMessage({ ...payload.payload, event: 'delete' });
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

    const encryptedContent = encryptMessage(content);

    const msg: ChatMessage = {
      id: generateUUID(),
      room: currentRoom,
      senderId: user.id,
      senderName: user.name || user.email || 'Anonymous',
      receiverId: receiver?.id,
      receiverName: receiver?.name,
      content: encryptedContent,
      type,
      fileUrl: fileMeta?.url,
      fileName: fileMeta?.name,
      timestamp: Date.now(),
      status: 'sending',
    };

    setMessages(prev => [...prev, { ...msg, content: content }]);

    try {
      // 1. Insert into database
      const { error: insertError } = await supabase.from('chat_messages').insert({
        id: msg.id,
        room: msg.room,
        sender_id: msg.senderId,
        sender_name: msg.senderName,
        receiver_id: msg.receiverId,
        receiver_name: msg.receiverName,
        content: encryptedContent,
        type: msg.type,
        file_url: msg.fileUrl,
        file_name: msg.fileName,
      });

      if (insertError) {
        throw insertError;
      }

      // 2. Broadcast to others
      const result = await channelRef.current.send({
        type: 'broadcast',
        event: 'message',
        payload: { message: { ...msg, content: encryptedContent } }, // Send encrypted content
      });

      if (result === 'ok') {
        console.log(`Chat: Message ${msg.id} sent and broadcasted to room ${currentRoom}`);
        // The sender will receive their own message back via broadcast,
        // which becomes the single source of truth for status updates.
        // We can, however, mark it as 'sent' locally.
        setMessages(prev => prev.map(m => (m.id === msg.id ? { ...m, status: 'sent' } : m)));
      } else {
        throw new Error('Broadcast failed');
      }
    } catch (error) {
      console.error(`Chat: Failed to send message ${msg.id}. Error:`, error);
      toast({ title: 'Message Failed', description: 'Could not send message. Please try again.', variant: 'destructive' });
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentRoom || !channelRef.current || channelRef.current.state !== 'joined') {
      toast({ title: 'Cannot delete message', description: 'You are not connected to a chat room.', variant: 'destructive' });
      return;
    }
    
    console.log(`Chat: Broadcasting delete for message ${messageId} in room ${currentRoom}`);

    try {
      // Optimistically update the UI for the sender
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: '[This message has been deleted]', deleted: true, type: 'system' } : m
      ));
      
      // Update the database
      await supabase.from('chat_messages').update({ content: '[deleted]', deleted: true }).eq('id', messageId);

      await channelRef.current.send({
        type: 'broadcast',
        event: 'delete',
        payload: { messageId },
      });
      if (user) {
        await notifyChatEvent(user.id, 'chat_message_deleted', `Message deleted in ${currentRoom}`, { msgId: messageId });
      }
    } catch (error) {
      console.error(`Chat: Failed to broadcast delete for message ${messageId}. Error:`, error);
      toast({ title: 'Delete Failed', description: 'Could not delete message. Please try again.', variant: 'destructive' });
      // Note: Here you might want to revert the optimistic update on failure.
      // For simplicity, we'll leave it as is for now.
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
      deleteMessage,
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
