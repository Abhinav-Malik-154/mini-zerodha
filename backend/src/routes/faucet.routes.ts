import { Router, Request, Response } from 'express';
import { BlockchainService } from '../services/blockchain.service';

const router = Router();
const blockchainService = new BlockchainService();

router.post('/request', async (req: Request, res: Response) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ success: false, error: 'Address is required' });
  }

  try {
    console.log(`🚰 Faucet request for ${address}`);
    // Send 5 ETH
    const txHash = await blockchainService.fundWallet(address, '5.0');
    return res.json({ success: true, txHash, message: 'Sent 5.0 ETH to your wallet!' });
  } catch (err: any) {
    console.error('Faucet error:', err);
    return res.status(500).json({ success: false, error: 'Faucet failed: ' + err.message });
  }
});

export default router;
