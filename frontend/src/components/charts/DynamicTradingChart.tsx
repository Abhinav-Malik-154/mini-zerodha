'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, IChartApi, UTCTimestamp, CandlestickData } from 'lightweight-charts';
import { motion } from 'framer-motion';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useSymbol } from '@/context/SymbolContext';

type TimeframeType = '1H' | '24H' | '7D' | '30D' | '1Y';

interface ChartData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export default function DynamicTradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  
  const { prices, isConnected } = useRealTimeData();
  const { selectedSymbol, availableSymbols } = useSymbol();
  
  const [timeframe, setTimeframe] = useState<TimeframeType>('24H');
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(51201.38);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update current price when prices change
  useEffect(() => {
    if (prices[selectedSymbol]) {
      setCurrentPrice(prices[selectedSymbol].price);
    }
  }, [prices, selectedSymbol]);

  // Generate historical data based on selected symbol and timeframe
  const generateHistoricalData = useCallback((): ChartData[] => {
    const data: ChartData[] = [];
    
    // Base prices for different symbols
    const basePrices: Record<string, number> = {
      'BTC/USD': currentPrice,
      'ETH/USD': 3135.69,
      'SOL/USD': 102.34
    };
    
    let basePrice = basePrices[selectedSymbol] || currentPrice;
    const now = Math.floor(Date.now() / 1000);
    
    // Determine number of candles and interval based on timeframe
    let candles = 100;
    let intervalSeconds = 300; // 5 minutes default
    
    switch(timeframe) {
      case '1H':
        candles = 60;
        intervalSeconds = 60; // 1 minute candles
        break;
      case '24H':
        candles = 288;
        intervalSeconds = 300; // 5 minute candles
        break;
      case '7D':
        candles = 168;
        intervalSeconds = 3600; // 1 hour candles
        break;
      case '30D':
        candles = 720;
        intervalSeconds = 3600; // 1 hour candles
        break;
      case '1Y':
        candles = 365;
        intervalSeconds = 86400; // 1 day candles
        break;
    }
    
    // Different volatility for different assets
    let volatility = 0.02; // Default 2%
    if (selectedSymbol === 'BTC/USD') volatility = 0.015;
    if (selectedSymbol === 'ETH/USD') volatility = 0.025;
    if (selectedSymbol === 'SOL/USD') volatility = 0.035;
    
    // Generate candles with realistic price movements
    for (let i = candles; i >= 0; i--) {
      const time = (now - i * intervalSeconds) as UTCTimestamp;
      
      // Random walk with trend
      const trend = Math.sin(i / 10) * 0.01; // Add some cyclical pattern
      const change = (Math.random() - 0.5 + trend) * volatility * basePrice;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * volatility * basePrice * 0.3;
      const low = Math.min(open, close) - Math.random() * volatility * basePrice * 0.3;
      
      data.push({
        time,
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 10000) + 1000
      });
      
      basePrice = close;
    }
    
    return data;
  }, [selectedSymbol, timeframe, currentPrice]);

  // Load data when symbol or timeframe changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = generateHistoricalData();
      setChartData(data);
    } catch (err) {
      setError('Failed to generate chart data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSymbol, timeframe, generateHistoricalData]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0 || isLoading) return;

    // Clear container
    while (chartContainerRef.current.firstChild) {
      chartContainerRef.current.removeChild(chartContainerRef.current.firstChild);
    }

    try {
      // Create chart with proper dimensions
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
          fixLeftEdge: true,
          fixRightEdge: true,
        },
        rightPriceScale: {
          borderColor: '#1E293B',
          scaleMargins: {
            top: 0.1,
            bottom: 0.2,
          },
        },
      });

      // Add candlestick series
      const candlestickSeries = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderDownColor: '#EF4444',
        borderUpColor: '#10B981',
        wickDownColor: '#EF4444',
        wickUpColor: '#10B981',
      });

      candlestickSeries.setData(chartData);

      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#3B82F6',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      });

      const volumeData = chartData.map((d, i) => ({
        time: d.time,
        value: d.volume || Math.random() * 10000 + 1000,
        color: d.close >= d.open ? '#10B98180' : '#EF444480',
      }));

      volumeSeries.setData(volumeData);

      // Configure volume scale
      chart.priceScale('').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Fit content
      chart.timeScale().fitContent();

      chartRef.current = chart;
      candlestickSeriesRef.current = candlestickSeries;
      volumeSeriesRef.current = volumeSeries;

    } catch (err) {
      setError('Failed to render chart');
      console.error(err);
    }

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartData, isLoading]);

  // Update last candle with real-time price
  useEffect(() => {
    if (!candlestickSeriesRef.current || chartData.length === 0 || isLoading) return;

    try {
      const lastCandle = chartData[chartData.length - 1];
      const updatedCandle = {
        time: lastCandle.time,
        open: lastCandle.open,
        high: Math.max(lastCandle.high, currentPrice),
        low: Math.min(lastCandle.low, currentPrice),
        close: currentPrice,
      };
      
      candlestickSeriesRef.current.update(updatedCandle);
    } catch (e) {
      // Silent fail for real-time updates
    }
  }, [currentPrice, chartData, isLoading]);

  const timeframeOptions: { label: string; value: TimeframeType }[] = [
    { label: '1H', value: '1H' },
    { label: '24H', value: '24H' },
    { label: '7D', value: '7D' },
    { label: '30D', value: '30D' },
    { label: '1Y', value: '1Y' },
  ];

  const currentSymbolData = prices[selectedSymbol] || {
    change24h: -1.92,
    volume: 514
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/10"
    >
      {/* Header with Symbol Selector and Timeframe */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">Chart</h2>
          <select
            value={selectedSymbol}
            onChange={(e) => useSymbol().setSelectedSymbol(e.target.value as any)}
            className="bg-slate-700/50 text-white rounded-lg px-3 py-1 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {availableSymbols.map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex gap-1 bg-slate-700/30 p-1 rounded-lg">
          {timeframeOptions.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeframe(value)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                timeframe === value
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-slate-400">
            {isConnected ? 'Live' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-[400px] bg-slate-900/20 rounded-lg relative"
        style={{ minHeight: '400px' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400">Loading chart...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Price Info */}
      <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-sm text-slate-400">Price</span>
            <span className="text-2xl font-bold text-white ml-2">
              ${currentPrice.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-sm text-slate-400">24h Change</span>
            <span className={`text-2xl font-bold ml-2 ${
              currentSymbolData.change24h >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {currentSymbolData.change24h >= 0 ? '+' : ''}{currentSymbolData.change24h?.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-sm text-slate-400">Volume</span>
            <span className="text-2xl font-bold text-white ml-2">
              {currentSymbolData.volume?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          Updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}