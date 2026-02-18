import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import tradeRoutes from './routes/trade.routes';
import { connectDatabase } from './services/database.service';
import { WebSocketService } from './services/websocket.service';

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server for WebSocket
const PORT = process.env.PORT || 5000;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Make WebSocket service available in routes
app.set('wsService', wsService);

// Routes
app.use('/api/trades', tradeRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'Trading Platform API is running!' });
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start server with database connection
const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(PORT, () => { // Use server.listen instead of app.listen
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`🔌 WebSocket server ready for real-time data`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  wsService.cleanup();
  process.exit();
});

startServer();