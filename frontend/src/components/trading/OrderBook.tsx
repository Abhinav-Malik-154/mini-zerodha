'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Order {
  price: number;
  amount: number;
  total?: number;
}

interface OrderBookData {
  bids: Order[];
  asks: Order[];
  spread: number;
  timestamp: number;
}

export default function OrderBook() {
  const [orderBooks, setOrderBooks] = useState<Record<string, OrderBookData>>({});
  const [symbol, setSymbol] = useState('BTC/USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    const generateMockOrderBook = (basePrice: number): OrderBookData => {
      const bids: Order[] = [];
      const asks: Order[] = [];

      for (let i = 0; i < 10; i++) {
        bids.push({
          price: Number((basePrice - (i * 10) - (Math.random() * 5)).toFixed(2)),
          amount: Number((Math.random() * 2 + 0.1).toFixed(3))
        });
      }

      for (let i = 0; i < 10; i++) {
        asks.push({
          price: Number((basePrice + (i * 10) + (Math.random() * 5)).toFixed(2)),
          amount: Number((Math.random() * 2 + 0.1).toFixed(3))
        });
      }

      bids.sort((a, b) => b.price - a.price);
      asks.sort((a, b) => a.price - a.price);

      return {
        bids,
        asks,
        spread: asks[0]?.price - bids[0]?.price || 0,
        timestamp: Date.now()
      };
    };

    const mockData: Record<string, OrderBookData> = {
      'BTC/USD': generateMockOrderBook(66569.43),
      'ETH/USD': generateMockOrderBook(1927.08),
      'SOL/USD': generateMockOrderBook(80.92)
    };

    setOrderBooks(mockData);
    setIsLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setOrderBooks(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (updated[key]) {
            const newBids = updated[key].bids.map(bid => ({
              ...bid,
              amount: Number((bid.amount + (Math.random() - 0.5) * 0.1).toFixed(3))
            }));
            const newAsks = updated[key].asks.map(ask => ({
              ...ask,
              amount: Number((ask.amount + (Math.random() - 0.5) * 0.1).toFixed(3))
            }));
            
            updated[key] = {
              ...updated[key],
              bids: newBids,
              asks: newAsks,
              timestamp: Date.now()
            };
          }
        });
        return updated;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Safely get current order book with fallback
  const currentOrderBook = orderBooks?.[symbol] || {
    bids: [],
    asks: [],
    spread: 0,
    timestamp: Date.now()
  };

  // Calculate totals for each order
  const bidsWithTotal = currentOrderBook.bids.map(bid => ({
    ...bid,
    total: bid.price * bid.amount
  }));

  const asksWithTotal = currentOrderBook.asks.map(ask => ({
    ...ask,
    total: ask.price * ask.amount
  }));

  const maxBidTotal = Math.max(...bidsWithTotal.map(b => b.total), 1);
  const maxAskTotal = Math.max(...asksWithTotal.map(a => a.total), 1);

  if (isLoading) {
    return (
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10">
        <div className="h-8 bg-slate-700/20 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 bg-slate-700/20 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

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
          className="bg-slate-700/50 text-white rounded-lg px-3 py-1 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            ${currentOrderBook.spread.toFixed(2)} ({((currentOrderBook.spread / (asksWithTotal[0]?.price || 1)) * 100).toFixed(2)}%)
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
        Updated: {new Date(currentOrderBook.timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  );
}