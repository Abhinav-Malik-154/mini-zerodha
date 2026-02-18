'use client';

import { motion } from 'framer-motion';
import PriceTicker from '@/components/trading/PriceTicker';
import OrderBook from '@/components/trading/OrderBook';
import TradeForm from '@/components/trading/TradeForm';
import RecentTrades from '@/components/trading/RecentTrades';
import TradingChart from '@/components/charts/TradingChart';

export default function TradePage() {
  return (
    <div className="space-y-6">
      <PriceTicker />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TradingChart />
        </div>
        <OrderBook />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TradeForm />
        <RecentTrades />
      </div>
    </div>
  );
}