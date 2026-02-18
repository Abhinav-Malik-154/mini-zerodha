import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketService {
  private io: SocketIOServer;
  private activeUsers: Map<string, Set<string>> = new Map(); // symbol -> userIds
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private orderBookInterval: NodeJS.Timeout | null = null;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    console.log('🔌 WebSocket server initializing...');
    this.setupEventHandlers();
    this.startPriceFeed();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      socket.on('subscribe', ({ symbol, userId }) => {
        socket.join(`market:${symbol}`);
        console.log(`📊 Client ${socket.id} subscribed to ${symbol}`);
        
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
        console.log(`📊 Client ${socket.id} unsubscribed from ${symbol}`);
        
        if (userId && this.activeUsers.has(symbol)) {
          this.activeUsers.get(symbol)?.delete(userId);
        }
      });

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });
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

    this.priceUpdateInterval = setInterval(() => {
      const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
      
      symbols.forEach(symbol => {
        const priceData = this.generatePriceData(symbol);
        this.io.to(`market:${symbol}`).emit('price-update', priceData);
        this.io.emit('market-update', priceData);
      });
    }, 2000);

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
    }, 1000);
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