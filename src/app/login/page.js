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
    console.log('Login Page - User:', user, 'Loading:', loading);
    
    if (user && !loading) {
      console.log('User exists, redirecting to home');
      router.push('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting username:', username);
    
    if (!username.trim()) return;
    
    const success = await register(username.trim());
    console.log('Registration success:', success);
    
    if (success) {
      router.push('/');
    }
  };

  // If user is logged in, render nothing while redirecting
  if (user && !loading) {
    console.log('Rendering null due to existing user');
    return null;
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          placeholder="Username" 
        />
        <button type="submit">Login</button>
      </form>
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