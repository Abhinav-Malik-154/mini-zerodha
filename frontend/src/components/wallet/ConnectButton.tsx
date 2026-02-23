'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  WalletIcon,
  ChevronDownIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  DocumentDuplicateIcon,
  StarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Menu } from '@headlessui/react';
import { useWallet } from '@/context/WalletProvider';
import { useAuth } from '@/context/AuthProvider';

export default function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const { address, balance, isConnected, connect, disconnect, changeAccount } = useWallet();
  const { login, token } = useAuth();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const requestFaucet = async () => {
    if (!address) return;
    setFaucetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/faucet/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Sent 5 ETH to ${address.slice(0,6)}...`);
      } else {
        alert('❌ Faucet failed: ' + data.error);
      }
    } catch (err) {
      alert('❌ Faucet error');
    } finally {
      setFaucetLoading(false);
    }
  };

  // run login when wallet is newly connected and no token exists yet
  useEffect(() => {
    if (isConnected && address && !token) {
      login();
    }
  }, [isConnected, address, token]);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        onClick={connect}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all"
      >
        <WalletIcon className="w-5 h-5" />
        <span>Connect Wallet</span>
        <ChevronDownIcon className="w-4 h-4" />
      </motion.button>
    );
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-white rounded-xl hover:bg-slate-700/70 transition-colors"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="text-sm text-slate-400 hidden sm:inline">
          {balance} ETH
        </span>
        <ChevronDownIcon className="w-4 h-4" />
      </Menu.Button>

      <Menu.Items
        as={motion.div}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute right-0 mt-2 w-48 bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg divide-y divide-slate-700 ring-1 ring-white/10 focus:outline-none z-50"
      >
        <div className="px-3 py-2">
          <p className="text-xs text-slate-400 truncate">{address}</p>
        </div>
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={changeAccount}
                className={`${
                  active ? 'bg-slate-700/50' : ''
                } w-full flex items-center gap-2 px-3 py-2 text-sm text-white`}
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span>Change account</span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={requestFaucet}
                disabled={faucetLoading}
                className={`${
                  active ? 'bg-slate-700/50' : ''
                } w-full flex items-center gap-2 px-3 py-2 text-sm text-white`}
              >
                <BanknotesIcon className="w-5 h-5 text-green-400" />
                <span>{faucetLoading ? 'Sending ETH...' : 'Get 5 Test ETH'}</span>
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(address);
                }}
                className={`${
                  active ? 'bg-slate-700/50' : ''
                } w-full flex items-center gap-2 px-3 py-2 text-sm text-white`}
              >
                <DocumentDuplicateIcon className="w-5 h-5" />
                <span>Copy address</span>
              </button>
            )}
          </Menu.Item>
          {!token && (
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={login}
                  className={`${
                    active ? 'bg-slate-700/50' : ''
                  } w-full flex items-center gap-2 px-3 py-2 text-sm text-white`}
                >
                  <StarIcon className="w-5 h-5" />
                  <span>Sign in</span>
                </button>
              )}
            </Menu.Item>
          )}
        </div>
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={disconnect}
                className={`${
                  active ? 'bg-red-600/40' : ''
                } w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400`}
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Disconnect</span>
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
}
