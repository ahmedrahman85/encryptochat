"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { encryptMessage, decryptMessage } from './utils/cryptoUtils';
import { toast } from 'react-toastify';

// Wrapper component to provide auth context
export default function Home() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

// Main chat application
function ChatApp() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState({});
  
  // Always call all hooks unconditionally
  const users = useQuery(api.users.list) || [];
  const sendMessage = useMutation(api.messages.send);
  const updateLastSeen = useMutation(api.users.updateLastSeen);
  
  // For conditional queries, always call the hook but pass a skipQuery flag
  const userId = user?.id;
  const selectedUserId = selectedUser?._id;
  
  // Always call these hooks, but with empty/null arguments when data isn't available
  const conversation = useQuery(
    api.messages.getConversation,
    userId && selectedUserId 
      ? { user1Id: userId, user2Id: selectedUserId } 
      : "skip"  // Use a special value that your query handler can check for
  ) || [];
  
  const recentConversations = useQuery(
    api.messages.getRecentConversations,
    userId ? { userId } : "skip"
  ) || [];
  
  // All users except the current user
  const otherUsers = users.filter(u => u._id !== user?.id);
  
  // Recent conversation partners with user objects
  const conversationPartners = recentConversations.map(msg => {
    const partnerId = msg.sender === user?.id ? msg.recipient : msg.sender;
    return users.find(u => u._id === partnerId);
  }).filter(Boolean);
  
  // All potential chat partners (including those with no messages yet)
  const allPartners = [...new Map(
    [...conversationPartners, ...otherUsers]
      .filter(Boolean)
      .map(user => [user._id, user])
  ).values()];
  
  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    
    try {
      // Encrypt the message with recipient's public key
      const encryptedContent = await encryptMessage(
        message,
        selectedUser.publicKey
      );
      
      // Send the encrypted message
      await sendMessage({
        content: encryptedContent,
        senderId: user.id,
        recipientId: selectedUser._id
      });
      
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return null; // Will redirect to login
  }
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Conversations</h2>
          <button 
            onClick={logout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
        
        <div className="overflow-y-auto h-full pb-20">
          {allPartners.length === 0 ? (
            <div className="p-4 text-gray-500">No users available to chat with.</div>
          ) : (
            allPartners.map((partner) => (
              <div
                key={partner._id}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedUser?._id === partner._id ? 'bg-indigo-50' : ''
                }`}
                onClick={() => setSelectedUser(partner)}
              >
                <div className="font-medium">{partner.name}</div>
                <div className="text-sm text-gray-500">
                  {partner.lastSeen
                    ? `Last seen: ${new Date(partner.lastSeen).toLocaleString()}`
                    : 'Offline'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-white">
              <h2 className="text-xl font-semibold">{selectedUser.name}</h2>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversation.length === 0 ? (
                <div className="text-center text-gray-500 mt-4">
                  No messages yet. Say hello!
                </div>
              ) : (
                conversation.map((msg) => (
                  <div
                    key={msg._id}
                    className={`max-w-md p-3 rounded-lg ${
                      msg.sender === user.id
                        ? 'ml-auto bg-indigo-500 text-white'
                        : 'bg-white border'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {msg.sender === user.id ? 'You' : selectedUser.name}
                    </div>
                    <div>
                      {decryptedMessages[msg._id] || 'Decrypting...'}
                    </div>
                    <div className="text-xs text-right mt-1 opacity-70">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}