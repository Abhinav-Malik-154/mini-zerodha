"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useWallet } from '@/context/WalletProvider';

interface User {
  walletAddress: string;
  username?: string;
  email?: string;
  createdAt: string;
  lastLogin: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// simple helper to persist token in localStorage
function getStoredToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useWallet();
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [user, setUser] = useState<User | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Attempt to fetch user profile if token exists
    const fetchUser = async () => {
      if (token && !user) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
             // Token invalid
             logout();
          }
        } catch (err) {
          console.error('Failed to fetch user', err);
        }
      }
    };
    fetchUser();
  }, [token]);

  const login = async () => {
    if (!address || !isConnected) return;
    try {
      // 1. Get nonce from backend (prevents replay attacks)
      const nonceRes = await fetch(`${API_BASE}/api/auth/nonce/${address}`);
      const nonceData = await nonceRes.json();
      
      if (!nonceRes.ok || !nonceData.nonce) {
        console.error('Nonce fetch error:', nonceData);
        throw new Error(nonceData.error || 'Failed to get nonce from server');
      }

      const message = `Sign this message to log in. Nonce: ${nonceData.nonce}`;

      // Fix #11: check for wallet provider — works for MetaMask, Coinbase Wallet, etc.
      // WalletConnect does NOT inject window.ethereum — guard against that.
      const eth = typeof window !== 'undefined' ? (window as any).ethereum : null;
      if (!eth) {
        console.error('No Web3 wallet detected. Install MetaMask or use WalletConnect.');
        return;
      }
      
      const signature = await eth.request({
        method: 'personal_sign',
        params: [message, address]
      });

      // 2. Submit signature for verification
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature })
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('auth_token', data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('login failed', err);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  };

  // Fix #12: clear stale JWT when MetaMask switches to a different address.
  // Without this, wallet A's token is used while operating as wallet B.
  const prevAddressRef = useRef<string>('');
  useEffect(() => {
    const prev = prevAddressRef.current;
    prevAddressRef.current = address;
    if (prev && address && prev !== address && token) {
      logout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const value: AuthContextType = {
    token,
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
