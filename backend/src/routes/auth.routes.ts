import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { ethers } from 'ethers';
import { authenticate } from '../middleware/authenticate'; // Fix: Import middleware

const router = Router();

// Fix #1: Generate a nonce for login (Replay Attack Prevention)
router.get('/nonce/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  if (!address) {
    res.status(400).json({ error: 'Address required' });
    return;
  }

  try {
    // Generate simple random nonce
    const nonce = Math.floor(Math.random() * 1000000).toString();
    console.log(`Generating nonce ${nonce} for ${address}`);
    
    // Save specific nonce to user record
    const user = await User.findOneAndUpdate(
      { walletAddress: address },
      { $set: { nonce } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    if (!user) throw new Error('Failed to create/update user');

    res.json({ nonce });
  } catch (err: any) {
    console.error('auth.nonce error:', err);
    res.status(500).json({ error: 'Failed to generate nonce: ' + err.message });
  }
});
// Profile endpoint to fetch current user data
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const walletAddress = (req as any).user.walletAddress;
    const user = await User.findOne({ walletAddress });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        walletAddress: user.walletAddress,
        userId: user._id,
        username: user.username || null,
        email: user.email || null,
        tradeCount: user.tradeCount || 0,
        totalVolume: user.totalVolume || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});
// login via wallet signature
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ success: false, error: 'address and signature are required' });
    }

    // 1. Fetch user to get the expected nonce
    const user = await User.findOne({ walletAddress: address });
    if (!user || !user.nonce) {
      return res.status(400).json({ success: false, error: 'Nonce not generated. Call /auth/nonce/:address first.' });
    }

    // 2. Reconstruct the message the user SHOULD have signed
    const expectedMessage = `Sign this message to log in. Nonce: ${user.nonce}`;

    // 3. Verify signature against that specific message
    const signer = ethers.verifyMessage(expectedMessage, signature);
    if (signer.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, error: 'Signature mismatch' });
    }

    // 4. Update user: Clear nonce (so it can't be reused) & set lastLogin
    user.nonce = undefined; 
    user.lastLogin = new Date();
    await user.save();

    // 5. Issue JWT
    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign({ 
      userId: user._id,
      walletAddress: address 
    }, secret, { expiresIn: '30d' });

    console.log('User logged in:', { userId: user._id, walletAddress: address });

    return res.json({
      success: true,
      token,
      user: {
        walletAddress: user.walletAddress,
        userId: user._id,
        username: user.username || null,
        email: user.email || null,
        tradeCount: user.tradeCount || 0,
        totalVolume: user.totalVolume || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (err: any) {
    console.error('auth.login error', err);
    return res.status(500).json({ success: false, error: err.message || 'login failed' });
  }
});

export default router;
