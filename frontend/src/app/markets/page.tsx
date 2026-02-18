'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface Market {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  marketCap: string;
  favorite: boolean;
}

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([
    { symbol: 'BTC/USD', name: 'Bitcoin', price: 51234.56, change24h: 2.34, volume: '28.4B', marketCap: '986B', favorite: true },
    { symbol: 'ETH/USD', name: 'Ethereum', price: 3123.45, change24h: -1.23, volume: '15.2B', marketCap: '375B', favorite: false },
    { symbol: 'SOL/USD', name: 'Solana', price: 102.34, change24h: 5.67, volume: '3.1B', marketCap: '42B', favorite: true },
    { symbol: 'BNB/USD', name: 'Binance Coin', price: 412.56, change24h: 0.45, volume: '1.8B', marketCap: '64B', favorite: false },
    { symbol: 'XRP/USD', name: 'Ripple', price: 0.78, change24h: -0.32, volume: '2.3B', marketCap: '42B', favorite: false },
    { symbol: 'ADA/USD', name: 'Cardano', price: 0.52, change24h: 1.23, volume: '0.9B', marketCap: '18B', favorite: false },
    { symbol: 'DOT/USD', name: 'Polkadot', price: 7.89, change24h: -2.34, volume: '0.5B', marketCap: '9B', favorite: false },
    { symbol: 'AVAX/USD', name: 'Avalanche', price: 38.45, change24h: 3.45, volume: '0.7B', marketCap: '13B', favorite: true },
  ]);

  const toggleFavorite = (symbol: string) => {
    setMarkets(markets.map(m => 
      m.symbol === symbol ? { ...m, favorite: !m.favorite } : m
    ));
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Markets</h2>
        
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search markets..."
            className="w-full bg-slate-700/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Markets Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-white/10">
                <th className="pb-3">Fav</th>
                <th className="pb-3">Asset</th>
                <th className="pb-3">Name</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">24h Change</th>
                <th className="pb-3">Volume (24h)</th>
                <th className="pb-3">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((market, idx) => (
                <motion.tr
                  key={market.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-4">
                    <button onClick={() => toggleFavorite(market.symbol)}>
                      {market.favorite ? (
                        <StarSolid className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <StarOutline className="w-5 h-5 text-slate-400 hover:text-yellow-400" />
                      )}
                    </button>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{market.symbol.split('/')[0]}</span>
                      </div>
                      <span className="text-white font-semibold">{market.symbol}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-300">{market.name}</td>
                  <td className="py-4 text-white">${market.price.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      market.change24h >= 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {market.change24h >= 0 ? '+' : ''}{market.change24h}%
                    </span>
                  </td>
                  <td className="py-4 text-white">${market.volume}</td>
                  <td className="py-4 text-white">${market.marketCap}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}