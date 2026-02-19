'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VerificationBadge from '../ui/VerificationBadge';

interface Trade {
  id: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  amount: number;
  time: string;
  tradeHash: string;
  verified: boolean;
}

export default function RecentTrades() {
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [lastTrade, setLastTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    const mockTrades: Trade[] = [
      {
        id: '1',
        side: 'BUY',
        symbol: 'BTC/USD',
        price: 66569.43,
        amount: 0.1,
        time: 'Just now',
        tradeHash: '0x1234...5678',
        verified: true
      },
      {
        id: '2',
        side: 'SELL',
        symbol: 'ETH/USD',
        price: 1927.08,
        amount: 0.5,
        time: '2 min ago',
        tradeHash: '0x8765...4321',
        verified: true
      },
      {
        id: '3',
        side: 'BUY',
        symbol: 'SOL/USD',
        price: 80.92,
        amount: 2.5,
        time: '5 min ago',
        tradeHash: '0x9876...1234',
        verified: true
      }
    ];

    setRecentTrades(mockTrades);
    setIsLoading(false);

    // Simulate new trades coming in
    const interval = setInterval(() => {
      const newTrade: Trade = {
        id: Date.now().toString(),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        symbol: ['BTC/USD', 'ETH/USD', 'SOL/USD'][Math.floor(Math.random() * 3)],
        price: 50000 + Math.random() * 20000,
        amount: Math.random() * 2,
        time: 'Just now',
        tradeHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
        verified: true
      };
      
      setLastTrade(newTrade);
      setRecentTrades(prev => [newTrade, ...prev].slice(0, 10));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10">
        <div className="h-6 bg-slate-700/20 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-700/20 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <h2 className="text-xl font-semibold text-white mb-4">Recent Trades</h2>
      
      <div className="space-y-3">
        <AnimatePresence>
          {lastTrade && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-3 bg-blue-500/20 rounded-xl ring-1 ring-blue-500/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-400">NEW</span>
                <span className={`text-sm font-semibold ${
                  lastTrade.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {lastTrade.side}
                </span>
                <span className="text-white font-mono">{lastTrade.symbol}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-white font-mono">
                  {lastTrade.amount} @ ${lastTrade.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">Just now</span>
                <VerificationBadge verified={true} hash={lastTrade.tradeHash} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Safe rendering with fallback empty array */}
        {recentTrades && recentTrades.length > 0 ? (
          recentTrades.map((trade, idx) => (
            <motion.div
              key={trade.id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between p-3 bg-slate-700/20 rounded-xl hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${
                  trade.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {trade.side}
                </span>
                <span className="text-white font-mono">{trade.symbol}</span>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-white font-mono">
                  {trade.amount} @ ${trade.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">{trade.time}</span>
                {trade.verified && (
                  <VerificationBadge verified={true} hash={trade.tradeHash} />
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400">
            No recent trades
          </div>
        )}
      </div>
    </motion.div>
  );
}