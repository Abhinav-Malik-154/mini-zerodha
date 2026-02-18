'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

export default function PortfolioPage() {
  const [portfolio] = useState({
    totalValue: 45234.67,
    todayChange: 1234.56,
    todayChangePercent: 2.78,
    holdings: [
      { asset: 'BTC', amount: 0.45, price: 51234, value: 23055.30, change24h: 2.34 },
      { asset: 'ETH', amount: 5.2, price: 3123, value: 16239.60, change24h: -1.23 },
      { asset: 'SOL', amount: 45, price: 102, value: 4590.00, change24h: 5.67 },
      { asset: 'USDT', amount: 1349.77, price: 1, value: 1349.77, change24h: 0.01 },
    ]
  });

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10 col-span-2">
          <p className="text-sm text-slate-400">Total Portfolio Value</p>
          <p className="text-3xl font-bold text-white mt-2">${portfolio.totalValue.toLocaleString()}</p>
          <p className="text-sm text-emerald-400 mt-1">
            ▲ ${portfolio.todayChange.toLocaleString()} ({portfolio.todayChangePercent}%)
          </p>
        </div>
        
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10">
          <p className="text-sm text-slate-400">Today's P&L</p>
          <p className="text-2xl font-bold text-emerald-400 mt-2">+${portfolio.todayChange.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-1">Updated just now</p>
        </div>
      </motion.div>

      {/* Holdings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Your Holdings</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-400 border-b border-white/10">
                <th className="pb-3">Asset</th>
                <th className="pb-3">Holdings</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Value</th>
                <th className="pb-3">24h Change</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((holding, idx) => (
                <motion.tr
                  key={holding.asset}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-white/5 last:border-0"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{holding.asset}</span>
                      </div>
                      <span className="text-white font-semibold">{holding.asset}/USD</span>
                    </div>
                  </td>
                  <td className="py-4 text-white">{holding.amount}</td>
                  <td className="py-4 text-white">${holding.price.toLocaleString()}</td>
                  <td className="py-4 text-white">${holding.value.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      holding.change24h >= 0 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {holding.change24h >= 0 ? '+' : ''}{holding.change24h}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Performance Chart Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Portfolio Performance</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl">
          <p className="text-slate-400">Chart coming soon...</p>
        </div>
      </motion.div>
    </div>
  );
}