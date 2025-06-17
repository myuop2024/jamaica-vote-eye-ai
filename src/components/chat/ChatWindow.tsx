import React, { useEffect, useRef, useState } from 'react';
import { useChat, ChatMessage } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';
import { UserSearch } from './UserSearch';

// Use a simpler emoji picker for now - can be replaced with emoji-mart later
const EMOJIS = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉'];

const dmRoomId = (id1: string, id2: string) => {
  return id1 < id2 ? `dm-${id1}-${id2}` : `dm-${id2}-${id1}`;
};

export const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const {
    messages,
    sendMessage,
    deleteMessage,
    joinRoom,
    leaveRoom,
    currentRoom,
    onlineUsers,
    uploadFile,
    connectionStatus,
  } = useChat();
  
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [room, setRoom] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (room) joinRoom(room);
    return () => {
      if(room) leaveRoom(room);
    }
    // eslint-disable-next-line
  }, [room, joinRoom, leaveRoom]);

  useEffect(() => {
    if (selectedUser && user) {
      const dmRoom = dmRoomId(user.id, selectedUser.id);
      setRoom(dmRoom);
    }
  }, [selectedUser, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !file) return;
    
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) { // 5GB limit
        alert('File size exceeds 5GB limit.');
        return;
      }
      try {
        const { url, name } = await uploadFile(file);
        sendMessage(
          input, // Send text along with file
          'file',
          { url, name },
          selectedUser ? { id: selectedUser.id, name: selectedUser.name } : undefined
        );
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('File upload failed:', error);
        alert('File upload failed. Please try again.');
        return;
      }
    } else {
      sendMessage(
        input,
        'text',
        undefined,
        selectedUser ? { id: selectedUser.id, name: selectedUser.name } : undefined
      );
    }
    setInput('');
    setShowEmoji(false);
  };

  const handleEdit = (msgId: string, content: string) => {
    setEditingMsgId(msgId);
    setEditInput(content); // Content is now plain text
  };

  const handleEditSave = () => {
    // Note: editMessage is not in the context anymore.
    // This would need to be re-implemented in ChatContext.
    // For now, this button does nothing.
    console.warn("Edit functionality is not implemented in the new ChatContext yet.");
    setEditingMsgId(null);
    setEditInput('');
  };

  const handleDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const canEditOrDelete = (msg: ChatMessage) => {
    if (!user) return false;
    // Simplified: only sender can "edit" (which is currently disabled)
    return msg.senderId === user.id && !msg.deleted;
  };

  const isOnline = connectionStatus === 'SUBSCRIBED';

  return (
    <div className="chat-window border rounded shadow-lg flex flex-col h-[80vh] sm:h-[600px] w-full max-w-2xl mx-auto bg-white">
      <div className="flex items-center border-b p-2 bg-gray-100 space-x-2">
        <select value={room} onChange={e => { setSelectedUser(null); setRoom(e.target.value); }} className="border rounded px-2 py-1">
          <option value="">Select Room</option>
          <option value="admin">Admin</option>
          {user?.assignedStation && <option value={`parish-${user.assignedStation}`}>Parish Room</option>}
          {user?.assignedStation && <option value={`roving-${user.assignedStation}`}>Roving Room</option>}
        </select>
        {selectedUser ? (
          <div className="flex items-center text-sm">
            <span>DM: {selectedUser.name}</span>
            <button onClick={() => { setSelectedUser(null); setRoom(''); }} className="ml-1 text-red-500 text-xs">✕</button>
          </div>
        ) : (
          <div className="flex-1">
            <UserSearch onSelect={(u) => setSelectedUser(u)} />
          </div>
        )}
        <div className="ml-auto flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} title={isOnline ? 'Online' : 'Offline'}></div>
           <span className="text-xs text-gray-500">
            {isOnline ? `Online: ${Object.keys(onlineUsers).length}` : 'Offline'}
          </span>
        </div>
      </div>
      
      {!isOnline && connectionStatus !== 'CLOSED' && (
        <div className="bg-yellow-100 border-b p-2 text-sm text-yellow-800">
          ⚠️ Chat is reconnecting or has a connection issue... ({connectionStatus})
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.filter(m => m.room === currentRoom).map((msg) => (
          <div key={msg.id} className={`mb-2 ${msg.senderId === user?.id ? 'text-right' : 'text-left'}`}> 
            <div className="inline-block bg-gray-200 rounded px-2 py-1 max-w-xs">
              <b className="text-sm">{msg.senderName}</b>{' '}
              {msg.deleted ? <i className="text-red-500">(deleted)</i> : (
                editingMsgId === msg.id ? (
                  <div className="mt-1">
                    <input value={editInput} onChange={e => setEditInput(e.target.value)} className="border px-1 py-1 rounded w-full" />
                    <div className="mt-1">
                      <button onClick={handleEditSave} className="mr-1 text-blue-600 text-xs">Save</button>
                      <button onClick={() => setEditingMsgId(null)} className="text-gray-600 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    {msg.type === 'file' ? (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{msg.fileName}</a>
                    ) : (
                      <span className="break-words italic">{msg.content}</span>
                    )}
                    {msg.content && msg.type === 'file' && <div className="text-sm italic text-gray-600">{msg.content}</div>}
                    {msg.edited && <span className="text-xs text-gray-400 ml-1">(edited)</span>}
                  </div>
                )
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                <div className="flex items-center">
                  <span className="text-xs mr-2">
                    {msg.status === 'sending' && '🕓'}
                    {msg.status === 'sent' && '✅'}
                    {msg.status === 'delivered' && '📬'}
                    {msg.status === 'read' && '👁️'}
                    {msg.status === 'failed' && '❌'}
                  </span>
                  {canEditOrDelete(msg) && !msg.deleted && (
                    <div>
                      <button onClick={() => handleEdit(msg.id, msg.content)} className="mr-1 text-blue-600 text-xs">Edit</button>
                      <button onClick={() => handleDelete(msg.id)} className="text-red-600 text-xs">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
       <div className="p-2 border-t bg-gray-50 flex items-center">
        <div className="relative">
          <button onClick={() => setShowEmoji(v => !v)} className="mr-2 p-1 hover:bg-gray-200 rounded">😊</button>
          {showEmoji && (
            <div className="absolute bottom-8 left-0 z-10 bg-white border rounded shadow-lg p-2">
              <div className="grid grid-cols-5 gap-1">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setInput(input + emoji);
                      setShowEmoji(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <input
          className="flex-1 border rounded px-2 py-1 mr-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />
        <button onClick={() => fileInputRef.current?.click()} className="mr-2 p-1 hover:bg-gray-200 rounded">📎</button>
        {file && <span className="mr-2 text-xs bg-blue-100 px-2 py-1 rounded">{file.name}</span>}
        <button onClick={handleSend} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Send</button>
      </div>
    </div>
  );
};
