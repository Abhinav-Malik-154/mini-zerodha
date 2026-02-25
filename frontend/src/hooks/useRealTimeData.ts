'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
}

export interface OrderBookData {
  bids: Array<{ price: number; amount: number; total?: number }>;
  asks: Array<{ price: number; amount: number; total?: number }>;
  spread: number;
  timestamp: number;
}

export interface TradeData {
  id?: string;
  side: 'BUY' | 'SELL';
  symbol: string;
  price: number;
  amount: number;
  time: string;
  tradeHash?: string;
  verified?: boolean;
}

export const useRealTimeData = () => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [orderBooks, setOrderBooks] = useState<Record<string, OrderBookData>>({});
  const [recentTrades, setRecentTrades] = useState<TradeData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTrade, setLastTrade] = useState<TradeData | null>(null);

  useEffect(() => {
    // Connect to your backend WebSocket
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);
      
      // Subscribe to default symbols
      ['BTC/USD', 'ETH/USD', 'SOL/USD'].forEach(symbol => {
        socket.emit('subscribe', { symbol });
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for price updates
    socket.on('price-update', (data: PriceData) => {
      setPrices(prev => ({
        ...prev,
        [data.symbol]: data
      }));
    });

    // Listen for market-wide updates
    socket.on('market-update', (data: PriceData) => {
      setPrices(prev => ({
        ...prev,
        [data.symbol]: data
      }));
    });

    // Listen for order book updates
    socket.on('orderbook-update', (data: { symbol: string } & OrderBookData) => {
      const { symbol, ...orderBook } = data;
      setOrderBooks(prev => ({
        ...prev,
        [symbol]: orderBook
      }));
    });

    // Listen for recent trades
    socket.on('recent-trade', (data: TradeData) => {
      setRecentTrades(prev => [data, ...prev].slice(0, 10));
      setLastTrade(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return {
    prices,
    orderBooks,
    recentTrades,
    lastTrade,
    isConnected
  };
};