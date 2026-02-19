'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useWebSocket } from '@/hooks/useWebSocket';
import { motion } from 'framer-motion';

export default function LiveTradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const { marketData, isConnected } = useWebSocket();
  const [chart, setChart] = useState<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chartInstance = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94A3B8',
      },
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });

    const candlestickSeries = chartInstance.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
    });

    setChart({ instance: chartInstance, series: candlestickSeries });

    return () => chartInstance.remove();
  }, []);

  // Update chart with new data from WebSocket
  useEffect(() => {
    if (chart?.series && marketData) {
      chart.series.update(marketData);
    }
  }, [marketData, chart]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">BTC/USD Live</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-400">
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>
      <div ref={chartContainerRef} />
    </motion.div>
  );
}