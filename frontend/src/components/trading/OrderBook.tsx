'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '@/hooks/useWebSocket';

interface Order {
  price: number;
  amount: number;
  total: number;
}

export default function OrderBook() {
  const { orderBooks, subscribeToSymbol } = useWebSocket();
  const [symbol, setSymbol] = useState('BTC/USD');

  useEffect(() => {
    subscribeToSymbol(symbol);
  }, [symbol, subscribeToSymbol]);

  const orderBook = orderBooks[symbol] || {
    bids: [],
    asks: [],
    spread: 0,
    timestamp: Date.now()
  };

  // Calculate totals
  const bidsWithTotal = orderBook.bids.map(bid => ({
    ...bid,
    total: bid.price * bid.amount
  }));

  const asksWithTotal = orderBook.asks.map(ask => ({
    ...ask,
    total: ask.price * ask.amount
  }));

  const maxBidTotal = Math.max(...bidsWithTotal.map(b => b.total), 1);
  const maxAskTotal = Math.max(...asksWithTotal.map(a => a.total), 1);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Order Book</h2>
        <select 
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="bg-slate-700/50 text-white rounded-lg px-3 py-1 text-sm"
        >
          <option value="BTC/USD">BTC/USD</option>
          <option value="ETH/USD">ETH/USD</option>
          <option value="SOL/USD">SOL/USD</option>
        </select>
      </div>
      
      {/* Asks (Sell orders) */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 grid grid-cols-3 mb-2 px-2">
          <span>Price (USD)</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Total (USD)</span>
        </div>
        {asksWithTotal.map((ask, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.02 }}
            className="relative grid grid-cols-3 text-sm py-1 px-2 hover:bg-red-500/10 rounded group"
          >
            <div 
              className="absolute right-0 top-0 bottom-0 bg-red-500/10 rounded"
              style={{ width: `${(ask.total / maxAskTotal) * 100}%` }}
            />
            <span className="text-red-400 font-mono relative z-10">${ask.price.toLocaleString()}</span>
            <span className="text-right text-slate-300 relative z-10">{ask.amount.toFixed(3)}</span>
            <span className="text-right text-slate-400 relative z-10">${ask.total.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      {/* Spread */}
      <div className="border-y border-white/10 py-3 my-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Spread</span>
          <span className="text-white font-mono">
            ${orderBook.spread.toFixed(2)} ({(orderBook.spread / (asksWithTotal[0]?.price || 1) * 100).toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Bids (Buy orders) */}
      <div>
        {bidsWithTotal.map((bid, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.02 }}
            className="relative grid grid-cols-3 text-sm py-1 px-2 hover:bg-green-500/10 rounded group"
          >
            <div 
              className="absolute right-0 top-0 bottom-0 bg-green-500/10 rounded"
              style={{ width: `${(bid.total / maxBidTotal) * 100}%` }}
            />
            <span className="text-green-400 font-mono relative z-10">${bid.price.toLocaleString()}</span>
            <span className="text-right text-slate-300 relative z-10">{bid.amount.toFixed(3)}</span>
            <span className="text-right text-slate-400 relative z-10">${bid.total.toLocaleString()}</span>
          </motion.div>
        ))}
      </div>

      {/* Last updated */}
      <div className="mt-4 text-xs text-slate-400 text-right">
        Updated: {new Date(orderBook.timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}