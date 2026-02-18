'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';
import VerificationBadge from '../ui/VerificationBadge';

export default function RecentTrades() {
  const { recentTrades, lastTrade, subscribeToSymbol } = useWebSocket();

  useEffect(() => {
    subscribeToSymbol('BTC/USD');
  }, [subscribeToSymbol]);

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
                  {lastTrade.quantity} @ ${lastTrade.price.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">Just now</span>
                <VerificationBadge verified={true} hash={lastTrade.tradeHash} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {recentTrades.map((trade, idx) => (
          <motion.div
            key={idx}
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
              <span className="text-xs text-slate-400">
                {new Date(trade.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}