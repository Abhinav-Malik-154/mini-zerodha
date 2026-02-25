'use client';

import PriceTicker from '@/components/trading/PriceTicker';
import OrderBook from '@/components/trading/OrderBook';
import RecentTrades from '@/components/trading/RecentTrades';
import DynamicTradingChart from '@/components/charts/DynamicTradingChart';
import AIPrediction from '@/components/trading/AIPrediction';
import MLPrediction from '@/components/trading/MLPrediction';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TradePage() {
  const router = useRouter();
  useEffect(() => {
    // redirect legacy trading page to the new stock view
    router.replace('/stocks/AAPL');
  }, [router]);

  return null;
}