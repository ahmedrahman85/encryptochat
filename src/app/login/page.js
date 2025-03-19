"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';

function LoginForm() {
  const [username, setUsername] = useState('');
  const { register, loading, user } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    const success = await register(username.trim());
    if (success) {
      router.push('/');
    }
  };

  // If user is logged in, render nothing while redirecting
  if (user && !loading) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-green-500 font-mono p-4">
      <div className="w-full max-w-md p-8 space-y-8 border border-green-500">
        <pre className="text-xs text-center">
{`
 _____                       _           _   
|  ___|                     | |         | |  
| |__ _ __   ___ _ __ _   _ | |_ ___  __| | 
|  __| '_ \\ / __| '__| | | || __/ _ \\/ _\` | 
| |__| | | | (__| |  | |_| || ||  __/ (_| | 
\\____/_| |_|\\___|_|   \\__, | \\__\\___|\\__,_|
                       __/ |                
                      |___/                 
`}
        </pre>
        
        <div className="text-center">
          <div className="text-xl mb-1">TERMINAL LOGIN</div>
          <div className="text-xs mb-4">SECURE CONNECTION REQUIRED</div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm mb-2">
              ENTER USERNAME:
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 bg-black border border-green-500 focus:outline-none focus:border-green-300 text-green-500"
              placeholder="_"
              disabled={loading}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 border border-green-500 hover:bg-green-900 hover:bg-opacity-30 focus:outline-none"
            >
              {loading ? 'CONNECTING...' : 'ESTABLISH CONNECTION'}
            </button>
          </div>
          
          <div className="text-center text-xs mt-4">
            <div className="blink">_</div>
            <div className="mt-2">END-TO-END ENCRYPTION ENABLED</div>
            <div>ALL MESSAGES ARE SECURELY ENCRYPTED</div>
          </div>
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
        
        .font-mono {
          font-family: 'VT323', 'Courier New', monospace;
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}