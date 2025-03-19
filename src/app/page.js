"use client";

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { encryptMessage, decryptMessage } from './convex/utils/cryptoUtils';
import { toast } from 'react-toastify';

// ASCII art and retro styles
const TERMINAL_ASCII = `
 _____                       _           _   _____ _           _   
|  ___|                     | |         | | /  __ \\ |         | |  
| |__ _ __   ___ _ __ _   _ | |_ ___  __| | | /  \\/ |__   __ _| |_ 
|  __| '_ \\ / __| '__| | | || __/ _ \\/ _\` | | |   | '_ \\ / _\` | __|
| |__| | | | (__| |  | |_| || ||  __/ (_| | | \\__/\\ | | | (_| | |_ 
\\____/_| |_|\\___|_|   \\__, | \\__\\___|\\__,_|  \\____/_| |_|\\__,_|\\__|
                       __/ |                                        
                      |___/                                         
`;

// Wrapper component to provide auth context
export default function Home() {
  return (
    <AuthProvider>
      <RetroChat />
    </AuthProvider>
  );
}

// Main chat application
function RetroChat() {
  const { user, loading, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [showUserList, setShowUserList] = useState(true);
  const messagesEndRef = useRef(null);
  
  // Always call hooks unconditionally
  const users = useQuery(api.users.list) || [];
  const sendMessage = useMutation(api.messages.send);
  const updateLastSeen = useMutation(api.users.updateLastSeen);
  
  // For conditional queries, always call the hook but pass a skipQuery flag
  const userId = user?.id;
  const selectedUserId = selectedUser?._id;
  
  // Always call these hooks, but with special values when data isn't available
  const conversation = useQuery(
    api.messages.getConversation,
    userId && selectedUserId 
      ? { user1Id: userId, user2Id: selectedUserId } 
      : "skip"
  ) || [];
  
  const recentConversations = useQuery(
    api.messages.getRecentConversations,
    userId ? { userId } : "skip"
  ) || [];
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, decryptedMessages]);
  
  // Authentication effects
  useEffect(() => {
    if (user && userId) {
      // Update last seen timestamp periodically
      const interval = setInterval(() => {
        updateLastSeen({ userId }).catch(console.error);
      }, 60000); // every minute
      
      return () => clearInterval(interval);
    }
  }, [user, userId, updateLastSeen]);
  
  // Decrypt messages when conversation changes
  useEffect(() => {
    async function decryptConversation() {
      if (!conversation.length) return;
      
      const newDecryptedMessages = { ...decryptedMessages };
      
      for (const msg of conversation) {
        // Skip if already decrypted
        if (newDecryptedMessages[msg._id]) continue;
        
        try {
          const decrypted = await decryptMessage(msg.content);
          newDecryptedMessages[msg._id] = decrypted;
        } catch (error) {
          console.error("Error decrypting message:", error);
          newDecryptedMessages[msg._id] = "[ENCRYPTION ERROR]";
        }
      }
      
      setDecryptedMessages(newDecryptedMessages);
    }
    
    decryptConversation();
  }, [conversation, decryptedMessages]);
  
  // All users except the current user
  const otherUsers = users.filter(u => u._id !== userId);
  
  // Recent conversation partners with user objects
  const conversationPartners = recentConversations.map(msg => {
    const partnerId = msg.sender === userId ? msg.recipient : msg.sender;
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
        senderId: userId,
        recipientId: selectedUserId
      });
      
      setMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  // Handle terminal commands
  const handleCommand = async (e) => {
    e.preventDefault();
    
    if (message.startsWith('/')) {
      const cmd = message.toLowerCase().trim();
      
      if (cmd === '/help') {
        toast.info('Available commands: /help, /users, /clear, /logout');
        setMessage('');
        return;
      }
      
      if (cmd === '/users') {
        setShowUserList(true);
        setSelectedUser(null);
        setMessage('');
        return;
      }
      
      if (cmd === '/clear') {
        // Just clear the input
        setMessage('');
        return;
      }
      
      if (cmd === '/logout') {
        logout();
        setMessage('');
        return;
      }
      
      toast.warning(`Unknown command: ${cmd}. Type /help for available commands.`);
      setMessage('');
      return;
    }
    
    // Not a command, send as regular message
    handleSendMessage(e);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-500 font-mono">
        <div className="text-center">
          <div className="text-xl mb-4">INITIALIZING SECURE CONNECTION...</div>
          <div className="animate-pulse">PLEASE STAND BY</div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-500 font-mono">
        <div className="text-center">
          <div className="text-xl mb-4">ACCESS DENIED</div>
          <div>AUTHENTICATION REQUIRED</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-black text-green-500 h-screen p-4 font-mono overflow-hidden">
      <div className="max-h-full flex flex-col">
        {/* Header with ASCII art */}
        <div className="mb-4 text-center">
          <pre className="text-xs">{TERMINAL_ASCII}</pre>
          <div className="text-xs mt-2">SECURE TERMINAL CONNECTION ESTABLISHED</div>
          <div className="text-xs">** END-TO-END ENCRYPTED **</div>
        </div>
        
        {showUserList ? (
          /* User Selection Screen */
          <div className="flex-1 overflow-auto border border-green-500 p-4">
            <div className="text-amber-500 mb-4">AVAILABLE TERMINAL CONNECTIONS:</div>
            
            {allPartners.length === 0 ? (
              <div className="text-gray-500">NO USERS AVAILABLE FOR CONNECTION.</div>
            ) : (
              <div className="space-y-2">
                {allPartners.map((partner) => (
                  <div
                    key={partner._id}
                    className="p-2 cursor-pointer hover:bg-green-900 hover:bg-opacity-30"
                    onClick={() => {
                      setSelectedUser(partner);
                      setShowUserList(false);
                    }}
                  >
                    <div className="text-amber-300">{partner.name}</div>
                    <div className="text-xs text-green-300">
                      {partner.lastSeen
                        ? `LAST ACTIVE: ${new Date(partner.lastSeen).toLocaleString()}`
                        : 'STATUS: OFFLINE'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-xs text-green-300">
              TYPE /help FOR AVAILABLE COMMANDS
            </div>
          </div>
        ) : (
          /* Chat Screen */
          <div className="flex-1 flex flex-col">
            <div className="bg-green-900 bg-opacity-20 p-2 text-amber-500">
              SECURE CONNECTION: {user.name} → {selectedUser?.name}
              <button 
                onClick={() => {
                  setShowUserList(true);
                  setSelectedUser(null);
                }}
                className="ml-4 text-xs text-green-300 hover:text-green-100"
              >
                [DISCONNECT]
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 border border-green-800">
              <div className="text-xs text-green-300 mb-4">
                === SESSION STARTED AT {new Date().toLocaleString()} ===
              </div>
              
              {conversation.length === 0 ? (
                <div className="text-center text-green-300 my-4">
                  NO PREVIOUS COMMUNICATIONS. ENCRYPTION ACTIVE.
                </div>
              ) : (
                conversation.map((msg) => (
                  <div key={msg._id} className="mb-2">
                    <span className={`${msg.sender === userId ? 'text-green-500' : 'text-amber-500'}`}>
                      {msg.sender === userId ? 'YOU' : selectedUser?.name}@terminal:
                    </span>{' '}
                    {decryptedMessages[msg._id] || 'DECRYPTING...'}
                    <div className="text-xs text-right opacity-50">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              
              <div className="blink inline-block">_</div>
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
        
        {/* Command Input */}
        <form onSubmit={handleCommand} className="mt-2 flex items-center">
          <span className="text-amber-500 mr-2">{user.name}@terminal:~$</span>
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            className="flex-1 bg-black border-none outline-none text-green-500" 
            autoFocus
          />
        </form>
      </div>
      
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .blink {
          animation: blink 1s step-end infinite;
        }
        
        /* Old terminal font styling */
        .font-mono {
          font-family: 'VT323', 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}