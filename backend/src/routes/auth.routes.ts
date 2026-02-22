import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { ethers } from 'ethers';

const router = Router();

// login via wallet signature
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { address, message, signature } = req.body;
    if (!address || !message || !signature) {
      return res.status(400).json({ success: false, error: 'address, message and signature are required' });
    }

    // verify signature
    // ethers v6 exports verifyMessage directly
    const signer = ethers.verifyMessage(message, signature);
    if (signer.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ success: false, error: 'signature mismatch' });
    }

    // upsert user record
    const user = await User.findOneAndUpdate(
      { walletAddress: address },
      {
        $set: { lastLogin: new Date() },
        $setOnInsert: { walletAddress: address, createdAt: new Date() }
      },
      { new: true, upsert: true }
    );

    const secret = process.env.JWT_SECRET || 'default_secret';
    const token = jwt.sign({ walletAddress: address }, secret, { expiresIn: '30d' });

    return res.json({ success: true, token, user });
  } catch (err: any) {
    console.error('auth.login error', err);
    return res.status(500).json({ success: false, error: err.message || 'login failed' });
  }
});

export default router;
