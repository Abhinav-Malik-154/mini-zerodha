import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/context/WalletProvider';
import { AuthProvider } from '@/context/AuthProvider';
import { SymbolProvider } from '@/context/SymbolContext'; // ✅ Correct import
import MainLayout from '@/components/layout/MainLayout';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mini-Zerodha - Hybrid Trading Platform',
  description: 'Trade with blockchain verification',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WalletProvider>
          <AuthProvider>
            <SymbolProvider> {/* ✅ This works now */}
              <MainLayout>
                {children}
              </MainLayout>
            </SymbolProvider>
          </AuthProvider>
        </WalletProvider>
      </body>
    </html>
  );
}