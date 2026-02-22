'use client';

import { motion } from 'framer-motion';
import PriceTicker from '@/components/trading/PriceTicker';
import OrderBook from '@/components/trading/OrderBook';
import QuickTrade from '@/components/trading/QuickTrade';
import DynamicTradingChart from '@/components/charts/DynamicTradingChart';

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Price Ticker */}
      <PriceTicker />

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          { label: 'Total Volume', value: '$1.2M', change: '+12.5%' },
          { label: 'Active Trades', value: '1,234', change: '+5.2%' },
          { label: 'Users', value: '892', change: '+18.1%' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
          >
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
            <p className="text-sm text-emerald-400 mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Trading Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DynamicTradingChart />
        </div>
        <OrderBook />
      </div>

      {/* Quick Trade — BTC/USD, ETH/USD, SOL/USD */}
      <QuickTrade />
    </div>
  );
}