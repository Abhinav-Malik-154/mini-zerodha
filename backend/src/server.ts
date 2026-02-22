import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import tradeRoutes from './routes/trade.routes';
import authRoutes from './routes/auth.routes';
import { connectDatabase } from './services/database.service';
import { WebSocketService } from './services/websocket.service';

dotenv.config();

// Fail loudly if JWT_SECRET is missing (tokens would be signed with 'default_secret')
if (!process.env.JWT_SECRET) {
  console.error('❌  WARNING: JWT_SECRET is not set in .env — using insecure default. Set it before deploying.');
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Security middleware
app.use(helmet());
// Fix #7: restrict CORS to known frontend origin only
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Fix #9: rate limiting
const authLimiter = rateLimit({
  windowMs: 60_000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests, slow down.' }
});
const tradeLimiter = rateLimit({
  windowMs: 60_000, max: 30,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, error: 'Too many requests, slow down.' }
});

// Make WebSocket service available in routes
app.set('wsService', wsService);

// Routes (rate limiters applied before route handlers)
app.use('/api/auth',   authLimiter,  authRoutes);
app.use('/api/trades', tradeLimiter, tradeRoutes);

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
    server.listen(PORT, () => {
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