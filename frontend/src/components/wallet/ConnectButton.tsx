'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WalletIcon } from '@heroicons/react/24/outline';

export default function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    setMounted(true);
    
    // Dynamically import web3 libraries only on client
    const initWeb3 = async () => {
      try {
        // This is where we'll initialize wallet connection
        console.log('Web3 ready to connect');
      } catch (error) {
        console.error('Failed to load web3:', error);
      }
    };
    
    initWeb3();
  }, []);

  const handleConnect = async () => {
    try {
      // Check if MetaMask is installed
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        if (accounts.length > 0) {
          setIsConnected(true);
          setAddress(accounts[0]);
          
          // Get balance
          const balance = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
          });
          
          // Convert from wei to ETH
          const ethBalance = parseInt(balance, 16) / 1e18;
          setBalance(ethBalance.toFixed(4));
        }
      } else {
        // No MetaMask, open WalletConnect
        window.open('https://walletconnect.com/', '_blank');
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  if (!mounted) {
    return (
      <button className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-xl">
        <span className="animate-pulse">Loading...</span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleConnect}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
      >
        <WalletIcon className="w-5 h-5" />
        <span>Connect Wallet</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-xl"
    >
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="font-mono">
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      <span className="text-sm text-slate-400 hidden sm:inline">
        {balance} ETH
      </span>
    </motion.button>
  );
}