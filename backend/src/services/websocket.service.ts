import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import WebSocket from 'ws';

export class WebSocketService {
  private io: SocketIOServer;
  private activeUsers: Map<string, Set<string>> = new Map();
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private orderBookInterval: NodeJS.Timeout | null = null;
  private binanceWs: WebSocket | null = null;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    console.log('WebSocket server initializing...');
    this.setupEventHandlers();
    this.connectToBinance();
    this.startPriceFeed();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('subscribe', ({ symbol, userId }) => {
        socket.join(`market:${symbol}`);
        console.log(`Client ${socket.id} subscribed to ${symbol}`);
        
        if (userId) {
          if (!this.activeUsers.has(symbol)) {
            this.activeUsers.set(symbol, new Set());
          }
          this.activeUsers.get(symbol)?.add(userId);
        }
        
        this.sendInitialData(socket, symbol);
      });

      socket.on('unsubscribe', ({ symbol, userId }) => {
        socket.leave(`market:${symbol}`);
        console.log(`Client ${socket.id} unsubscribed from ${symbol}`);
        
        if (userId && this.activeUsers.has(symbol)) {
          this.activeUsers.get(symbol)?.delete(userId);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  private connectToBinance() {
    try {
      // Connect to Binance WebSocket
      this.binanceWs = new WebSocket('wss://stream.binance.com:9443/ws');

      this.binanceWs.on('open', () => {
        console.log('Connected to Binance WebSocket');
        
        // Subscribe to BTC, ETH, SOL streams
        const subscribeMsg = {
          method: 'SUBSCRIBE',
          params: [
            'btcusdt@ticker',
            'ethusdt@ticker', 
            'solusdt@ticker',
            'btcusdt@depth20',
            'ethusdt@depth20',
            'solusdt@depth20'
          ],
          id: 1
        };
        
        this.binanceWs?.send(JSON.stringify(subscribeMsg));
      });

      this.binanceWs.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // Handle ticker updates
          if (message.stream?.includes('@ticker')) {
            const symbol = message.stream.replace('@ticker', '').toUpperCase();
            const tickerData = message.data;
            
            const priceData = {
              symbol: `${symbol}/USD`,
              price: parseFloat(tickerData.c),
              change24h: parseFloat(tickerData.P),
              volume: Math.floor(parseFloat(tickerData.v) / 1000),
              timestamp: Date.now()
            };
            
            this.io.to(`market:${symbol}/USD`).emit('price-update', priceData);
            this.io.emit('market-update', priceData);
          }
          
          // Handle order book updates
          if (message.stream?.includes('@depth20')) {
            const symbol = message.stream.replace('@depth20', '').toUpperCase();
            const depthData = message.data;
            
            const orderBook = {
              bids: depthData.bids.map(([price, amount]: [string, string]) => ({
                price: parseFloat(price),
                amount: parseFloat(amount)
              })),
              asks: depthData.asks.map(([price, amount]: [string, string]) => ({
                price: parseFloat(price),
                amount: parseFloat(amount)
              })),
              timestamp: Date.now()
            };
            
            this.io.to(`market:${symbol}/USD`).emit('orderbook-update', {
              symbol: `${symbol}/USD`,
              ...orderBook
            });
          }
        } catch (error) {
          console.error('Error parsing Binance message:', error);
        }
      });

      this.binanceWs.on('error', (error: Error) => {
        console.error('Binance WebSocket error:', error);
      });

      this.binanceWs.on('close', () => {
        console.log('Binance WebSocket closed, reconnecting...');
        setTimeout(() => this.connectToBinance(), 5000);
      });

    } catch (error) {
      console.error('Failed to connect to Binance:', error);
    }
  }

  private sendInitialData(socket: any, symbol: string) {
    const priceData = this.generatePriceData(symbol);
    socket.emit('price-update', priceData);
    
    const orderBook = this.generateOrderBook(symbol);
    socket.emit('orderbook-update', { symbol, ...orderBook });
  }

  private startPriceFeed() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }

    // Fallback price feed in case Binance disconnects
    this.priceUpdateInterval = setInterval(() => {
      const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
      
      symbols.forEach(symbol => {
        const priceData = this.generatePriceData(symbol);
        this.io.to(`market:${symbol}`).emit('price-update', priceData);
        this.io.emit('market-update', priceData);
      });
    }, 5000);

    if (this.orderBookInterval) {
      clearInterval(this.orderBookInterval);
    }

    this.orderBookInterval = setInterval(() => {
      const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
      
      symbols.forEach(symbol => {
        const orderBook = this.generateOrderBook(symbol);
        this.io.to(`market:${symbol}`).emit('orderbook-update', {
          symbol,
          ...orderBook
        });
      });
    }, 5000);
  }

  private generatePriceData(symbol: string) {
    const basePrices: Record<string, number> = {
      'BTC/USD': 51234.56,
      'ETH/USD': 3123.45,
      'SOL/USD': 102.34
    };
    
    const basePrice = basePrices[symbol] || 50000;
    const variation = (Math.random() - 0.5) * 100;
    const price = Number((basePrice + variation).toFixed(2));
    const change24h = Number(((Math.random() * 10) - 5).toFixed(2));
    const volume = Math.floor(Math.random() * 1000) + 100;
    
    return {
      symbol,
      price,
      change24h,
      volume,
      timestamp: Date.now()
    };
  }

  private generateOrderBook(symbol: string) {
    const bids = [];
    const asks = [];
    const basePrice = symbol === 'BTC/USD' ? 51234.56 : 
                     symbol === 'ETH/USD' ? 3123.45 : 102.34;

    for (let i = 0; i < 10; i++) {
      bids.push({
        price: Number((basePrice - (i * 10) - (Math.random() * 5)).toFixed(2)),
        amount: Number((Math.random() * 2 + 0.1).toFixed(3))
      });
    }

    for (let i = 0; i < 10; i++) {
      asks.push({
        price: Number((basePrice + (i * 10) + (Math.random() * 5)).toFixed(2)),
        amount: Number((Math.random() * 2 + 0.1).toFixed(3))
      });
    }

    bids.sort((a, b) => b.price - a.price);
    asks.sort((a, b) => a.price - b.price);

    return { 
      bids, 
      asks, 
      timestamp: Date.now(),
      spread: asks[0]?.price - bids[0]?.price || 0
    };
  }

  public emitTradeConfirmation(tradeData: any) {
    this.io.to(`user:${tradeData.userId}`).emit('trade-confirmed', {
      ...tradeData,
      confirmedAt: Date.now()
    });
    
    this.io.emit('recent-trade', {
      symbol: tradeData.symbol,
      price: tradeData.price,
      amount: tradeData.quantity,
      side: tradeData.side,
      timestamp: Date.now()
    });
  }

  public cleanup() {
    if (this.binanceWs) {
      this.binanceWs.close();
    }
    
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
    }
    if (this.orderBookInterval) {
      clearInterval(this.orderBookInterval);
    }
  }

  public getActiveUsers(symbol: string): number {
    return this.activeUsers.get(symbol)?.size || 0;
  }
}