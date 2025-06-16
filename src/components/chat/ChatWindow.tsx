import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.REACT_APP_CHAT_ENCRYPTION_KEY || 'default_secret_key';

function encryptMessage(message: string) {
  return CryptoJS.AES.encrypt(message, ENCRYPTION_KEY).toString();
}
function decryptMessage(ciphertext: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8) || ciphertext;
  } catch {
    return ciphertext;
  }
}

export const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    joinRoom,
    leaveRoom,
    currentRoom,
    onlineUsers,
    uploadFile,
  } = useChat();
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [room, setRoom] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (room) joinRoom(room);
    return () => leaveRoom(room);
    // eslint-disable-next-line
  }, [room]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !file) return;
    let encrypted = encryptMessage(input);
    if (file) {
      if (file.size > 5 * 1024 * 1024 * 1024) {
        alert('File size exceeds 5GB limit.');
        return;
      }
      const { url, name } = await uploadFile(file, room);
      sendMessage(room, encrypted, 'file', { url, name });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      sendMessage(room, encrypted);
    }
    setInput('');
    setShowEmoji(false);
  };

  const handleEdit = (msgId: string, content: string) => {
    setEditingMsgId(msgId);
    setEditInput(decryptMessage(content));
  };

  const handleEditSave = () => {
    if (editingMsgId) {
      editMessage(editingMsgId, encryptMessage(editInput));
      setEditingMsgId(null);
      setEditInput('');
    }
  };

  const canEditOrDelete = (msg: any) => {
    if (!user) return false;
    if (msg.senderId === user.id) return true;
    if (user.role === 'admin') return true;
    if ((user.role === 'parish_coordinator' || user.role === 'roving_observer') && msg.room.includes(user.assignedStation)) return true;
    return false;
  };

  return (
    <div className="chat-window border rounded shadow-lg flex flex-col h-[600px] w-full max-w-2xl mx-auto">
      <div className="flex items-center border-b p-2 bg-gray-100">
        <select value={room} onChange={e => setRoom(e.target.value)} className="mr-2">
          <option value="">Select Room</option>
          {/* Example room options, replace with dynamic logic */}
          <option value="admin">Admin</option>
          <option value={`parish-${user?.assignedStation}`}>Parish Room</option>
          <option value={`roving-${user?.assignedStation}`}>Roving Room</option>
        </select>
        <span className="ml-auto text-xs text-gray-500">Online: {Object.values(onlineUsers).join(', ')}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {messages.filter(m => m.room === room).map((msg, i) => (
          <div key={msg.id} className={`mb-2 ${msg.senderId === user?.id ? 'text-right' : 'text-left'}`}> 
            <div className="inline-block bg-gray-200 rounded px-2 py-1">
              <b>{msg.senderName}</b>{' '}
              {msg.deleted ? <i className="text-red-500">(deleted)</i> : (
                editingMsgId === msg.id ? (
                  <>
                    <input value={editInput} onChange={e => setEditInput(e.target.value)} className="border px-1" />
                    <button onClick={handleEditSave} className="ml-1 text-blue-600">Save</button>
                    <button onClick={() => setEditingMsgId(null)} className="ml-1 text-gray-600">Cancel</button>
                  </>
                ) : (
                  <span>
                    {msg.type === 'file' ? (
                      <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">{msg.fileName}</a>
                    ) : (
                      <span>{decryptMessage(msg.content)}</span>
                    )}
                    {msg.edited && <span className="text-xs text-gray-400 ml-1">(edited)</span>}
                  </span>
                )
              )}
              <span className="ml-2 text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <span className="ml-2 text-xs">
                {msg.status === 'sending' && '🕓'}
                {msg.status === 'sent' && '✅'}
                {msg.status === 'delivered' && '📬'}
                {msg.status === 'read' && '👁️'}
                {msg.status === 'failed' && '❌'}
              </span>
              {canEditOrDelete(msg) && !msg.deleted && (
                <>
                  <button onClick={() => handleEdit(msg.id, msg.content)} className="ml-2 text-blue-600 text-xs">Edit</button>
                  <button onClick={() => deleteMessage(msg.id)} className="ml-1 text-red-600 text-xs">Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div className="p-2 border-t bg-gray-50 flex items-center">
        <button onClick={() => setShowEmoji(v => !v)} className="mr-2">😊</button>
        {showEmoji && (
          <div className="absolute bottom-16 left-2 z-10">
            <Picker onSelect={emoji => setInput(input + emoji.native)} showPreview={false} showSkinTones={false} />
          </div>
        )}
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
        <button onClick={() => fileInputRef.current?.click()} className="mr-2">📎</button>
        {file && <span className="mr-2 text-xs">{file.name}</span>}
        <button onClick={handleSend} className="bg-blue-600 text-white px-3 py-1 rounded">Send</button>
      </div>
    </div>
  );
}; 