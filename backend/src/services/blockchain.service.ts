import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Import your contract ABI (Forge output contains abi as a nested key)
const contractJSON = require('../abis/TradeVerifier.json');
const contractABI = contractJSON.abi || contractJSON;

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  
  constructor() {
    // Check if environment variables exist
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!rpcUrl) {
      throw new Error('❌ RPC_URL not found in environment variables');
    }
    if (!privateKey) {
      throw new Error('❌ PRIVATE_KEY not found in environment variables');
    }
    if (!contractAddress) {
      throw new Error('❌ CONTRACT_ADDRESS not found in environment variables');
    }
    
    try {
      // Connect to your local Anvil instance
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.wallet
      );
      
      console.log('✅ Blockchain Service initialized');
      console.log(`📄 Contract Address: ${contractAddress}`);
      console.log(`🌐 RPC URL: ${rpcUrl}`);
      console.log(`👤 Wallet Address: ${this.wallet.address}`);
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      throw error;
    }
  }
  
  // Verify a trade on-chain
  async verifyTrade(tradeData: any): Promise<any> {
    try {
      // Deterministic ABI-compatible hash — matches keccak256(abi.encode(...)) in Solidity
      // Field order MUST match Interact.s.sol: 'trade', timestamp, trader, keccak256(symbol), price, quantity
      const tradeHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'uint256', 'address', 'bytes32', 'uint256', 'uint256'],
          [
            'trade',
            BigInt(tradeData.timestamp),
            tradeData.walletAddress || ethers.ZeroAddress,
            ethers.keccak256(ethers.toUtf8Bytes(tradeData.symbol)),
            BigInt(Math.round(tradeData.price)),
            BigInt(Math.round(tradeData.quantity * 1e8)), // 8 decimal places
          ]
        )
      );

      console.log(`🔗 Verifying trade on-chain: ${tradeHash}`);
      const tx = await this.contract.verifyTrade(tradeHash);
      const receipt = await tx.wait();

      return {
        success: true,
        tradeHash,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('❌ Blockchain verification failed:', error);
      throw error;
    }
  }
  
  // Get trade proof from blockchain
  async getTradeProof(tradeHash: string): Promise<any> {
    try {
      const proof = await this.contract.getTradeProof(tradeHash);
      return {
        exists: proof.exists,
        trader: proof.trader,
        timestamp: proof.timestamp.toString(),
        blockNumber: proof.blockNumber.toString(),
        previousHash: proof.previousHash
      };
    } catch (error) {
      console.error('❌ Failed to get trade proof:', error);
      throw error;
    }
  }
  
  // Check if trade exists (simple version)
  async isTradeVerified(tradeHash: string): Promise<boolean> {
    try {
      const proof = await this.contract.getTradeProof(tradeHash);
      return proof.exists;
    } catch (error) {
      return false;
    }
  }
  
  async getStats(): Promise<any> {
    try {
      const stats = await this.contract.getStats();
      return {
        totalTrades: stats[0].toString(),
        totalUsers: stats[1].toString(),
        lastTradeHash: stats[2],
        lastTimestamp: stats[3].toString()
      };
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      throw error;
    }
  }
}