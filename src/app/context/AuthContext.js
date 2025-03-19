"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { generateKeyPair } from '../../utils/cryptoUtils';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const registerUser = useMutation(api.users.register);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Register a new user
  const register = async (username) => {
    try {
      setLoading(true);
      
      // Generate encryption keys
      const { publicKey } = await generateKeyPair();
      
      // Register user in the database
      const userId = await registerUser({
        name: username,
        publicKey: publicKey,
      });
      
      // Save user info to state and localStorage
      const userInfo = { id: userId, name: username };
      setUser(userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      toast.error(`Registration failed: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Log out the user
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // Note: We're not removing the private key on logout
    // so the user can still decrypt their messages if they log back in
    toast.info('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);