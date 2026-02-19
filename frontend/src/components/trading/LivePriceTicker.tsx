'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRealTimeData } from '@/hooks/useRealTimeData';

export default function LivePriceTicker() {
  const { prices, isConnected } = useRealTimeData();

  const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];

  if (Object.keys(prices).length === 0) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-700/20 rounded-lg p-3 animate-pulse">
              <div className="h-4 bg-slate-600/50 rounded w-16 mb-2"></div>
              <div className="h-6 bg-slate-600/50 rounded w-24 mb-1"></div>
              <div className="h-3 bg-slate-600/50 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-xl p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-400">Live Market</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-400">
            {isConnected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {symbols.map(symbol => {
          const priceData = prices[symbol];
          if (!priceData) return null;
          
          const isPositive = priceData.change24h >= 0;

          return (
            <motion.div
              key={symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-700/20 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{symbol}</span>
                <span className={`text-xs flex items-center ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  {isPositive ? '▲' : '▼'} {Math.abs(priceData.change24h).toFixed(2)}%
                </span>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={priceData.price}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-bold text-white"
                >
                  ${priceData.price.toLocaleString()}
                </motion.div>
              </AnimatePresence>
              
              <div className="flex items-center justify-between mt-1 text-xs text-slate-400">
                <span>Vol: {priceData.volume}</span>
                <span>{new Date(priceData.timestamp).toLocaleTimeString()}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}