import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class WebSocketService {
  private io: SocketIOServer;
  private activeUsers: Map<string, Set<string>> = new Map(); // symbol -> userIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true
      }
    });

    this.setupEventHandlers();
    this.startPriceFeed();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id);

      // Subscribe to market data for specific symbols
      socket.on('subscribe', ({ symbol, userId }) => {
        socket.join(`market:${symbol}`);
        
        if (userId) {
          if (!this.activeUsers.has(symbol)) {
            this.activeUsers.set(symbol, new Set());
          }
          this.activeUsers.get(symbol)?.add(userId);
        }
        
        console.log(`👤 User ${userId} subscribed to ${symbol}`);
      });

      // Unsubscribe from market data
      socket.on('unsubscribe', ({ symbol, userId }) => {
        socket.leave(`market:${symbol}`);
        
        if (userId && this.activeUsers.has(symbol)) {
          this.activeUsers.get(symbol)?.delete(userId);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });
  }

  private startPriceFeed() {
    // Simulate live price updates (replace with actual exchange WebSocket)
    setInterval(() => {
      const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'];
      
      symbols.forEach(symbol => {
        const priceData = {
          symbol,
          price: this.generateRandomPrice(symbol),
          change24h: (Math.random() * 10 - 5).toFixed(2),
          volume: Math.floor(Math.random() * 1000) + 100,
          timestamp: Date.now()
        };

        // Broadcast to all clients subscribed to this symbol
        this.io.to(`market:${symbol}`).emit('price-update', priceData);
        
        // Also emit to general market channel
        this.io.emit('market-update', priceData);
      });
    }, 2000); // Update every 2 seconds

    // Simulate order book updates
    setInterval(() => {
      const symbol = 'BTC/USD';
      const orderBook = this.generateOrderBook();
      this.io.to(`market:${symbol}`).emit('orderbook-update', orderBook);
    }, 1000);
  }

  private generateRandomPrice(symbol: string): number {
    const basePrices: Record<string, number> = {
      'BTC/USD': 51234.56,
      'ETH/USD': 3123.45,
      'SOL/USD': 102.34
    };
    
    const basePrice = basePrices[symbol] || 50000;
    const variation = (Math.random() - 0.5) * 100;
    return Number((basePrice + variation).toFixed(2));
  }

  private generateOrderBook() {
    const bids = [];
    const asks = [];
    const basePrice = 51234.56;

    // Generate bids (buy orders)
    for (let i = 0; i < 10; i++) {
      bids.push({
        price: basePrice - i * 10,
        amount: Number((Math.random() * 2 + 0.1).toFixed(3))
      });
    }

    // Generate asks (sell orders)
    for (let i = 0; i < 10; i++) {
      asks.push({
        price: basePrice + i * 10,
        amount: Number((Math.random() * 2 + 0.1).toFixed(3))
      });
    }

    return { bids, asks, timestamp: Date.now() };
  }

  // Method to emit trade confirmation
  public emitTradeConfirmation(tradeData: any) {
    this.io.to(`user:${tradeData.userId}`).emit('trade-confirmed', {
      ...tradeData,
      confirmedAt: Date.now()
    });
  }

  // Get active users count for a symbol
  public getActiveUsers(symbol: string): number {
    return this.activeUsers.get(symbol)?.size || 0;
  }
}