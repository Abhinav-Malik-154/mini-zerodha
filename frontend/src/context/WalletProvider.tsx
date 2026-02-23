'use client';

import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { config } from '@/config/wallet';
import { WagmiProvider } from 'wagmi';

interface WalletProviderProps {
  children: ReactNode;
}

interface WalletContextType {
  address: string;
  balance: string;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  changeAccount: () => Promise<void>;
  refreshBalance: () => Promise<void>; // Add this
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function useEthereum() {
  if (typeof window !== 'undefined' && (window as any).ethereum) {
    return (window as any).ethereum;
  }
  return null;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiProvider config={config}>
      <InnerWalletProvider>{children}</InnerWalletProvider>
    </WagmiProvider>
  );
}

function InnerWalletProvider({ children }: WalletProviderProps) {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const fetchBalance = useCallback(
    async (account: string) => {
      try {
        const eth = useEthereum();
        if (eth) {
          const bal = await eth.request({
            method: 'eth_getBalance',
            params: [account, 'latest'],
          });
          const ethBalance = parseInt(bal, 16) / 1e18;
          setBalance(ethBalance.toFixed(4));
        }
      } catch (err) {
        console.error('Unable to fetch balance', err);
      }
    },
    []
  );

  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        setIsConnected(false);
        setAddress('');
        setBalance('');
      } else {
        setIsConnected(true);
        setAddress(accounts[0]);
        fetchBalance(accounts[0]);
        // Persist address so portfolio page can use it before auth loads
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_address', accounts[0]);
        }
      }
    },
    [fetchBalance]
  );

  const connect = useCallback(async () => {
    try {
      // clear the manual disconnect flag when user explicitly connects
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wallet_disconnected');
      }
      const eth = useEthereum();
      if (!eth) {
        window.open('https://walletconnect.com/', '_blank');
        return;
      }
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts as string[]);
    } catch (err) {
      console.error('Connection failed', err);
    }
  }, [handleAccountsChanged]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress('');
    setBalance('');
    if (typeof window !== 'undefined') {
      localStorage.setItem('wallet_disconnected', '1');
      localStorage.removeItem('user_address');
    }
  }, []);

  const changeAccount = useCallback(async () => {
    const eth = useEthereum();
    if (!eth) return;
    try {
      await eth.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      const accounts = await eth.request({ method: 'eth_accounts' });
      handleAccountsChanged(accounts as string[]);
    } catch (err) {
      console.error('account change failed', err);
    }
  }, [handleAccountsChanged]);

  const refreshBalance = useCallback(async () => {
    if (address) {
      // Poll a few times to catch block confirmations
      setTimeout(() => fetchBalance(address), 500);
      setTimeout(() => fetchBalance(address), 2000);
      setTimeout(() => fetchBalance(address), 5000);
    }
  }, [address, fetchBalance]);

  useEffect(() => {
    const eth = useEthereum();
    if (!eth) return;

    const doAuto = () => {
      const disconnected =
        typeof window !== 'undefined' &&
        localStorage.getItem('wallet_disconnected');
      if (disconnected) {
        // user manually logged out; skip auto-connection
        return;
      }

      eth.request({ method: 'eth_accounts' }).then((accounts: any) => {
        handleAccountsChanged(accounts as string[]);
      });
    };

    doAuto();

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', () => window.location.reload());

    return () => {
      if (!eth.removeListener) return;
      eth.removeListener('accountsChanged', handleAccountsChanged);
      eth.removeListener('chainChanged', () => window.location.reload());
    };
  }, [handleAccountsChanged]);

  const value: WalletContextType = {
    address,
    balance,
    isConnected,
    connect,
    disconnect,
    changeAccount,
    refreshBalance,  // Added
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return ctx;
}
