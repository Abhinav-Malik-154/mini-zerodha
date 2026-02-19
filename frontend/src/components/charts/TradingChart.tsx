'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, UTCTimestamp } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { useRealTimeData } from '@/hooks/useRealTimeData';

interface ChartData {
  time: UTCTimestamp; // Changed to UTCTimestamp (number)
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const { prices, isConnected } = useRealTimeData();
  
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '1W' | '1M'>('24H');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(66569.43);

  // Update current price when prices change
  useEffect(() => {
    if (prices['BTC/USD']) {
      setCurrentPrice(prices['BTC/USD'].price);
    }
  }, [prices]);

  // Generate historical data with correct timestamp format
  useEffect(() => {
    const generateHistoricalData = (): ChartData[] => {
      const data: ChartData[] = [];
      let basePrice = currentPrice;
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      
      for (let i = 30; i >= 0; i--) {
        // Use seconds-based timestamp (UTCTimestamp)
        const time = (now - i * 300) as UTCTimestamp; // 5-minute intervals in seconds
        
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility * basePrice;
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.5;
        const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.5;
        
        data.push({
          time,
          open,
          high,
          low,
          close,
        });
        
        basePrice = close;
      }
      
      return data;
    };

    setChartData(generateHistoricalData());
  }, [currentPrice, timeframe]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontFamily: 'Inter, sans-serif',
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: '#1E293B' },
        horzLines: { color: '#1E293B' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#3B82F6',
          width: 1,
          style: 1,
          labelBackgroundColor: '#1E293B',
        },
        horzLine: {
          color: '#3B82F6',
          width: 1,
          style: 1,
          labelBackgroundColor: '#1E293B',
        },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#10B981',
      wickDownColor: '#EF4444',
      wickUpColor: '#10B981',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Format data for chart - time is already UTCTimestamp
    candlestickSeries.setData(chartData);

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#3B82F6',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    // Configure volume scale
    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Generate volume data
    const volumeData = chartData.map((d, i) => ({
      time: d.time,
      value: Math.random() * 1000000 + 500000,
      color: d.close >= d.open ? '#10B98180' : '#EF444480',
    }));

    volumeSeries.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [chartData]);

  // Update last candle with real-time price
  useEffect(() => {
    if (candlestickSeriesRef.current && chartData.length > 0) {
      const lastCandle = chartData[chartData.length - 1];
      const updatedCandle = {
        ...lastCandle,
        close: currentPrice,
        high: Math.max(lastCandle.high, currentPrice),
        low: Math.min(lastCandle.low, currentPrice),
      };
      
      candlestickSeriesRef.current.update(updatedCandle);
    }
  }, [currentPrice, chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">BTC/USD Chart</h2>
          <p className={`text-sm ${prices['BTC/USD']?.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {prices['BTC/USD']?.change24h >= 0 ? '▲' : '▼'} {Math.abs(prices['BTC/USD']?.change24h || 0).toFixed(2)}%
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-400">
            {isConnected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-2">
          {(['1H', '24H', '1W', '1M'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                timeframe === tf
                  ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div ref={chartContainerRef} className="w-full h-[400px]" />

      {/* Current price */}
      <div className="mt-4 text-right">
        <span className="text-sm text-slate-400">Current Price: </span>
        <span className="text-lg font-bold text-white">${currentPrice.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}