'use client';

import PriceTicker from '@/components/trading/PriceTicker';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import DynamicTradingChart from '@/components/charts/DynamicTradingChart';

export default function TradePage() {
  return (
    <div className="space-y-6">
      <PriceTicker />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DynamicTradingChart />
        </div>
        <OrderBook />
      </div>

      <RecentTrades />
    </div>
  );
}