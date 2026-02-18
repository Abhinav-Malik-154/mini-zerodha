'use client';

import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface PriceData {
  symbol: string;
  price: number;
  change24h: string;
  volume: number;
  timestamp: number;
}

interface OrderBookData {
  bids: Array<{ price: number; amount: number }>;
  asks: Array<{ price: number; amount: number }>;
  timestamp: number;
}

export const useWebSocket = (userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [orderBook, setOrderBook] = useState<Record<string, OrderBookData>>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setIsConnected(false);
    });

    // Listen for price updates [citation:1]
    socketInstance.on('price-update', (data: PriceData) => {
      setPrices(prev => ({
        ...prev,
        [data.symbol]: data
      }));
    });

    // Listen for market-wide updates
    socketInstance.on('market-update', (data: PriceData) => {
      setPrices(prev => ({
        ...prev,
        [data.symbol]: data
      }));
    });

    // Listen for order book updates
    socketInstance.on('orderbook-update', (data: OrderBookData & { symbol: string }) => {
      setOrderBook(prev => ({
        ...prev,
        [data.symbol]: data
      }));
    });

    // Listen for trade confirmations
    socketInstance.on('trade-confirmed', (data: any) => {
      console.log('✅ Trade confirmed:', data);
      // You can trigger a refresh or show notification
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const subscribeToSymbol = useCallback((symbol: string) => {
    if (socket && isConnected) {
      socket.emit('subscribe', { symbol, userId });
    }
  }, [socket, isConnected, userId]);

  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    if (socket && isConnected) {
      socket.emit('unsubscribe', { symbol, userId });
    }
  }, [socket, isConnected, userId]);

  return {
    prices,
    orderBook,
    isConnected,
    subscribeToSymbol,
    unsubscribeFromSymbol
  };
};