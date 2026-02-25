// 'use client';

// import { useEffect, useState, useCallback, useRef } from 'react';
// import io, { Socket } from 'socket.io-client';

// interface PriceData {
//   symbol: string;
//   price: number;
//   change24h: number;
//   volume: number;
//   timestamp: number;
// }

// interface OrderBookData {
//   bids: Array<{ price: number; amount: number; total?: number }>;
//   asks: Array<{ price: number; amount: number; total?: number }>;
//   timestamp: number;
//   spread: number;
// }

// interface TradeConfirmation {
//   userId: string;
//   tradeHash: string;
//   symbol: string;
//   side: 'BUY' | 'SELL';
//   price: number;
//   quantity: number;
//   transactionHash: string;
//   confirmedAt: number;
// }

// export const useWebSocket = (userId?: string) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   const [prices, setPrices] = useState<Record<string, PriceData>>({});
//   const [orderBooks, setOrderBooks] = useState<Record<string, OrderBookData>>({});
//   const [recentTrades, setRecentTrades] = useState<any[]>([]);
//   const [isConnected, setIsConnected] = useState(false);
//   const [lastTrade, setLastTrade] = useState<TradeConfirmation | null>(null);
  
//   const socketRef = useRef<Socket | null>(null);

//   useEffect(() => {
//     // Connect to WebSocket server
//     const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
//       transports: ['websocket', 'polling'],
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//       autoConnect: true
//     });

//     socketRef.current = socketInstance;
//     setSocket(socketInstance);

//     socketInstance.on('connect', () => {
//       console.log('✅ WebSocket connected');
//       setIsConnected(true);
      
//       // Subscribe to default symbols
//       ['BTC/USD', 'ETH/USD', 'SOL/USD'].forEach(symbol => {
//         socketInstance.emit('subscribe', { symbol, userId });
//       });
//     });

//     socketInstance.on('disconnect', () => {
//       console.log('❌ WebSocket disconnected');
//       setIsConnected(false);
//     });

//     socketInstance.on('connect_error', (error) => {
//       console.error('WebSocket connection error:', error);
//       setIsConnected(false);
//     });

//     // Listen for price updates
//     socketInstance.on('price-update', (data: PriceData) => {
//       setPrices(prev => ({
//         ...prev,
//         [data.symbol]: data
//       }));
//     });

//     // Listen for market-wide updates
//     socketInstance.on('market-update', (data: PriceData) => {
//       setPrices(prev => ({
//         ...prev,
//         [data.symbol]: data
//       }));
//     });

//     // Listen for order book updates
//     socketInstance.on('orderbook-update', (data: { symbol: string } & OrderBookData) => {
//       const { symbol, ...orderBook } = data;
//       setOrderBooks(prev => ({
//         ...prev,
//         [symbol]: orderBook
//       }));
//     });

//     // Listen for trade confirmations
//     socketInstance.on('trade-confirmed', (data: TradeConfirmation) => {
//       console.log('✅ Trade confirmed:', data);
//       setLastTrade(data);
//     });

//     // Listen for recent trades
//     socketInstance.on('recent-trade', (data: any) => {
//       setRecentTrades(prev => [data, ...prev].slice(0, 10)); // Keep last 10 trades
//     });

//     // Cleanup on unmount
//     return () => {
//       if (socketInstance) {
//         ['BTC/USD', 'ETH/USD', 'SOL/USD'].forEach(symbol => {
//           socketInstance.emit('unsubscribe', { symbol, userId });
//         });
//         socketInstance.disconnect();
//       }
//     };
//   }, [userId]);

//   const subscribeToSymbol = useCallback((symbol: string) => {
//     if (socketRef.current && isConnected) {
//       socketRef.current.emit('subscribe', { symbol, userId });
//     }
//   }, [isConnected, userId]);

//   const unsubscribeFromSymbol = useCallback((symbol: string) => {
//     if (socketRef.current && isConnected) {
//       socketRef.current.emit('unsubscribe', { symbol, userId });
//     }
//   }, [isConnected, userId]);

//   return {
//     prices,
//     orderBooks,
//     recentTrades,
//     lastTrade,
//     isConnected,
//     subscribeToSymbol,
//     unsubscribeFromSymbol
//   };
// };
'use client';

import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useWebSocket = () => {
  const [marketData, setMarketData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });

    socket.on('market-data', (data) => {
      setMarketData(data);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { marketData, isConnected };
};