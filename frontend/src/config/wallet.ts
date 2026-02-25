import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { cookieStorage, createStorage } from 'wagmi';
import { mainnet, polygon, polygonAmoy } from 'wagmi/chains';

// Get projectId from environment
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

if (!projectId) {
  // warn at runtime but don't crash build/SSR — WalletConnect features will be disabled
  console.warn('⚠️  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set — WalletConnect will be disabled.');
}

// Define metadata for your app
export const metadata = {
  name: 'Mini-Zerodha',
  description: 'Hybrid Trading Platform with Blockchain Verification',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  icons: [process.env.NEXT_PUBLIC_APP_ICON_URL || 'https://avatars.githubusercontent.com/u/37784886']
};

// Configure chains
export const chains = [polygonAmoy, polygon, mainnet] as const;

// Create wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage
  }),
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

// Export projectId for use elsewhere
export { projectId };