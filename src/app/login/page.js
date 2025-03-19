"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '/home/ahmedeus/convex-encrypted-chat/src/app/context/AuthContext.js';

function LoginForm() {
  const [username, setUsername] = useState('');
  const { register, loading, user } = useAuth();
  const router = useRouter();

  // Move the redirect logic to useEffect
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Rest of your form component */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Encrypted Chat
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter a username to get started with end-to-end encrypted messaging
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Choose a username"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Join Chat'}
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>This application uses end-to-end encryption.</p>
            <p>Your messages can only be read by their intended recipients.</p>
          </div>
        </form>
      </div>
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