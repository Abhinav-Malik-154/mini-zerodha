import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ClientWalletProvider from '@/context/ClientWalletProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { SymbolProvider } from '@/context/SymbolContext';
import ReactQueryProvider from '@/context/ReactQueryProvider';
import MainLayout from '@/components/layout/MainLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TradePro - Hybrid Trading Platform',
  description: 'Trade with blockchain verification and get stock/crypto predicitons powered by AI and ML',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientWalletProvider>
          <AuthProvider>
            <ReactQueryProvider>
              <SymbolProvider>
                <MainLayout>
                  {children}
                </MainLayout>
              </SymbolProvider>
            </ReactQueryProvider>
          </AuthProvider>
        </ClientWalletProvider>
      </body>
    </html>
  );
}