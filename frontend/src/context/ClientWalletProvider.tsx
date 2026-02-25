'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// @web3modal/wagmi accesses indexedDB at init — keep it client-only
const WalletProvider = dynamic(
  () => import('@/context/WalletProvider').then((m) => m.WalletProvider),
  { ssr: false }
);

export default function ClientWalletProvider({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
