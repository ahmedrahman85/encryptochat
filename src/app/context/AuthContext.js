"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { generateKeyPair } from '../convex/utils/cryptoUtils';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  const registerUser = useMutation(api.users.register);

  // check if user is already logged in
  useEffect(() => {
    console.log('AuthProvider - Checking stored user');
    const storedUser = Cookies.get('user');
    console.log('Stored user cookie:', storedUser);

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Parsed user:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user:', error);
        Cookies.remove('user');
      }
    }
    
    setLoading(false);
  }, []);

  // register a new user
  const register = async (username) => {
    try {
      console.log('Registration started for:', username);
      setLoading(true);
      
      // generate encryption keys
      const { publicKey } = await generateKeyPair();
      
      // register user in the database
      const userId = await registerUser({
        name: username,
        publicKey: publicKey,
      });
      
      // save user info to cookies
      const userInfo = { id: userId, name: username };
      console.log('Setting user cookie:', userInfo);
      
      Cookies.set('user', JSON.stringify(userInfo), { 
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict' // Add this to ensure cookie is set correctly
      });
      
      setUser(userInfo);
      
      // redirect to home
      router.push('/');
      
      toast.success('SECURE CONNECTION ESTABLISHED');
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(`CONNECTION FAILED: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // log out the user
  const logout = () => {
    Cookies.remove('user');
    setUser(null);
    router.push('/login');
    toast.info('TERMINAL DISCONNECTED');
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);