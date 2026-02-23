import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { BlockchainService } from '../services/blockchain.service';
import Trade from '../models/Trade.model';
import User from '../models/User.model';

const router = Router();

// Fix #5: wrap at module-level so a missing env var doesn't crash ALL routes
let blockchainService: BlockchainService | null = null;
try {
  blockchainService = new BlockchainService();
} catch (err) {
  console.error('⚠️  BlockchainService unavailable — blockchain features disabled:', err);
}

// Fix #10: validated symbol/side whitelists
const VALID_SYMBOLS = new Set(['BTC/USD', 'ETH/USD', 'SOL/USD']);
const VALID_SIDES   = new Set(['BUY', 'SELL']);

function validateTrade(symbol: any, price: any, quantity: any, side: any): string | null {
  if (!symbol || !VALID_SYMBOLS.has(symbol))    return `symbol must be one of: ${[...VALID_SYMBOLS].join(', ')}`;
  if (!side   || !VALID_SIDES.has(side))         return `side must be BUY or SELL`;
  const p = Number(price), q = Number(quantity);
  if (!isFinite(p) || p <= 0)                    return 'price must be a positive number';
  if (!isFinite(q) || q <= 0)                    return 'quantity must be a positive number';
  if (p > 10_000_000)                            return 'price out of range';
  if (q > 1_000_000)                             return 'quantity out of range';
  return null;
}

// Test route
router.get('/test', (_req: Request, res: Response) => {
  return res.json({ 
    success: true, 
    message: 'Trade routes are working!',
    timestamp: new Date().toISOString()
  });
});

// Verify a trade (requires authentication)
router.post('/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const { symbol, price, quantity, side } = req.body;
    
    // SECURITY FIX: Trust the token, not the body
    const { walletAddress, userId: tokenUserId } = (req as any).user || {};
    
    if (!walletAddress) {
      return res.status(401).json({ success: false, error: 'User must be authenticated' });
    }
    
    // Prefer the real Mongo userId if available, else fallback to wallet address (legacy/compat)
    const userId = tokenUserId || walletAddress;

    // Fix #10: validate all fields before touching DB or chain
    const validationError = validateTrade(symbol, price, quantity, side);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    // Fix #5: return 503 if blockchain is unavailable
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        error: 'Blockchain service is unavailable. Check RPC_URL, PRIVATE_KEY and CONTRACT_ADDRESS in .env'
      });
    }

    const tradeData = {
      symbol,
      price: Number(price),
      quantity: Number(quantity),
      side,
      userId,
      walletAddress: walletAddress || null,
      timestamp: Date.now()
    };

    const result = await blockchainService.verifyTrade(tradeData);

    // Wallet ETH movement for ALL trades
    // BUY:  User already sent ETH to treasury from the frontend MetaMask popup.
    // SELL: Treasury sends ETH proceeds back to the user.
    if (walletAddress) {
      if (side === 'BUY') {
        const clientEthPrice = Number(req.body.ethPrice) || 3000;
        const costInEth = (Number(quantity) * Number(price)) / clientEthPrice;
        console.log(`📥 BUY recorded: user paid ~${costInEth.toFixed(6)} ETH for ${quantity} ${symbol}`);
      } else if (side === 'SELL') {
        const clientEthPrice = Number(req.body.ethPrice) || 3000;
        const proceedsInEth = (Number(quantity) * Number(price)) / clientEthPrice;
        console.log(`💸 SELL: Sending ~${proceedsInEth.toFixed(6)} ETH to ${walletAddress}`);
        try {
          const fundTxHash = await blockchainService!.fundWallet(walletAddress, proceedsInEth.toFixed(18));
          console.log('✅ ETH proceeds sent:', fundTxHash);
        } catch (fundErr) {
          console.error('❌ Failed to send ETH proceeds:', fundErr);
        }
      }
    }

    const newTrade = new Trade({
      userId: tradeData.userId,
      walletAddress: tradeData.walletAddress,
      symbol: tradeData.symbol,
      side: tradeData.side,
      price: tradeData.price,
      quantity: tradeData.quantity,
      tradeHash: result.tradeHash,
      transactionHash: result.transactionHash,
      blockNumber: result.blockNumber,
      verifiedAt: new Date()
    });

    await newTrade.save();
    console.log('💾 Trade saved to database');

    // Update user stats
    if (walletAddress) {
      await User.findOneAndUpdate(
        { walletAddress },
        {
          $set: { lastLogin: new Date() },
          $setOnInsert: { walletAddress, createdAt: new Date() },
          $inc: { tradeCount: 1, totalVolume: Number(price) * Number(quantity) }
        },
        { upsert: true }
      );
    }

    return res.json({
      success: true,
      message: 'Trade verified on blockchain and saved to database',
      data: {
        ...result,
        dbId: newTrade._id,
        trade: {
          symbol: newTrade.symbol,
          side: newTrade.side,
          price: newTrade.price,
          quantity: newTrade.quantity,
          walletAddress: newTrade.walletAddress,
          verifiedAt: newTrade.verifiedAt
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Trade verification failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify trade'
    });
  }
});

// Get trade proof
router.get('/proof/:tradeHash', async (req: Request, res: Response) => {
  try {
    const tradeHashParam = req.params.tradeHash;
    const tradeHash = Array.isArray(tradeHashParam) ? tradeHashParam[0] : tradeHashParam;
    
    if (!tradeHash) {
      return res.status(400).json({
        success: false,
        error: 'Trade hash is required'
      });
    }
    
    // Get from blockchain
    const proof = await blockchainService.getTradeProof(tradeHash);
    
    // Also get from database if exists
    const dbTrade = await Trade.findOne({ tradeHash });
    
    return res.json({
      success: true,
      data: {
        blockchain: proof,
        database: dbTrade || null
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get trade proof:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade proof'
    });
  }
});

// Check if trade is verified
router.get('/verified/:tradeHash', async (req: Request, res: Response) => {
  try {
    const tradeHashParam = req.params.tradeHash;
    const tradeHash = Array.isArray(tradeHashParam) ? tradeHashParam[0] : tradeHashParam;

    if (!tradeHash) {
      return res.status(400).json({
        success: false,
        error: 'Trade hash is required'
      });
    }

    // Check on blockchain
    const isVerified = await blockchainService.isTradeVerified(tradeHash);
    
    // Check in database
    const dbTrade = await Trade.findOne({ tradeHash });
    
    return res.json({
      success: true,
      data: {
        tradeHash,
        isVerified,
        inDatabase: !!dbTrade,
        dbRecord: dbTrade || null
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check verification'
    });
  }
});

// Get trade history for a user
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Safely parse query parameters
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;
    
    // Convert to numbers safely
    let limit = 50;
    let offset = 0;
    
    if (typeof limitParam === 'string') {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100); // Cap at 100
      }
    }
    
    if (typeof offsetParam === 'string') {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
    
    const trades = await Trade.find({ userId })
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .skip(offset);
    
    const total = await Trade.countDocuments({ userId });
    
    return res.json({
      success: true,
      data: {
        trades,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get trade history:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade history'
    });
  }
});

// Get trades by wallet address
router.get('/wallet/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;
    
    // Safely parse query parameters
    const limitParam = req.query.limit;
    const offsetParam = req.query.offset;
    
    // Convert to numbers safely
    let limit = 50;
    let offset = 0;
    
    if (typeof limitParam === 'string') {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 100);
      }
    }
    
    if (typeof offsetParam === 'string') {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }
    
    const trades = await Trade.find({ walletAddress })
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .skip(offset);
    
    const total = await Trade.countDocuments({ walletAddress });
    
    return res.json({
      success: true,
      data: {
        trades,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get wallet trades:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get wallet trades'
    });
  }
});

// Get stats (combined blockchain + database)
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    // Blockchain stats
    let blockchainStats = null;
    try {
      blockchainStats = await blockchainService.getStats();
    } catch (error) {
      console.warn('⚠️ Could not fetch blockchain stats:', error);
      blockchainStats = { error: 'Blockchain stats unavailable' };
    }
    
    // Database stats
    const totalTradesDB = await Trade.countDocuments();
    const totalUsersDB = await User.countDocuments();
    const recentTrades = await Trade.find().sort({ verifiedAt: -1 }).limit(5);
    
    // Get volume stats
    const volumeStats = await Trade.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: { $sum: { $multiply: ['$price', '$quantity'] } },
          avgPrice: { $avg: '$price' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);
    
    return res.json({
      success: true,
      data: {
        blockchain: blockchainStats,
        database: {
          totalTrades: totalTradesDB,
          totalUsers: totalUsersDB,
          recentTrades,
          volume: volumeStats[0] || { totalVolume: 0, avgPrice: 0, totalQuantity: 0 }
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to get stats:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get statistics'
    });
  }
});

// Get single trade by ID
router.get('/:tradeId', async (req: Request, res: Response) => {
  try {
    const { tradeId } = req.params;
    
    const trade = await Trade.findById(tradeId);
    
    if (!trade) {
      return res.status(404).json({
        success: false,
        error: 'Trade not found'
      });
    }
    
    return res.json({
      success: true,
      data: trade
    });
  } catch (error: any) {
    console.error('❌ Failed to get trade:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get trade'
    });
  }
});

export default router;