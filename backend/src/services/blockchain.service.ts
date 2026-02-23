import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// import the ABI (forge puts it in a nested .abi key)
const contractJSON = require('../abis/TradeVerifier.json');
const contractABI = contractJSON.abi || contractJSON;

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  
  constructor() {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    
    if (!rpcUrl) {
      throw new Error('RPC_URL not found in .env');
    }
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not found in .env');
    }
    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS not found in .env');
    }
    
    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(
        contractAddress,
        contractABI,
        this.wallet
      );
      
      console.log('Blockchain service initialized');
      console.log(`Contract: ${contractAddress}`);
      console.log(`RPC: ${rpcUrl}`);
      console.log(`Wallet: ${this.wallet.address}`);
    } catch (error) {
      console.error('Failed to init blockchain service:', error);
      throw error;
    }
  }
  
  async verifyTrade(tradeData: any): Promise<any> {
    try {
      if (!tradeData || !tradeData.symbol || !tradeData.price || !tradeData.quantity) {
        throw new Error('Invalid trade data: missing required fields');
      }

      const trader = tradeData.walletAddress || ethers.ZeroAddress;
      
      // deterministic hash matching the solidity side
      // field order must match Interact.s.sol: 'trade', timestamp, trader, keccak256(symbol), price, quantity
      const tradeHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ['string', 'uint256', 'address', 'bytes32', 'uint256', 'uint256'],
          [
            'trade',
            BigInt(tradeData.timestamp || Date.now()),
            trader,
            ethers.keccak256(ethers.toUtf8Bytes(tradeData.symbol)),
            BigInt(Math.round(tradeData.price)),
            BigInt(Math.round(tradeData.quantity * 1e8)), // 8 decimal places
          ]
        )
      );

      console.log(`Verifying trade on-chain: ${tradeHash} for ${trader}`);
      
      const tx = await this.contract.verifyTrade(tradeHash, trader);
      const receipt = await tx.wait();

      return {
        success: true,
        tradeHash,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error) {
      console.error('Blockchain verification failed:', error);
      throw error;
    }
  }
  
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
      console.error('Failed to get trade proof:', error);
      throw error;
    }
  }

  // send ETH to an address (used for sell proceeds and dev faucet)
  async fundWallet(address: string, amountEth: string = '5.0'): Promise<string> {
    try {
      if (!this.wallet) throw new Error('Wallet not initialized');
      
      // use 'pending' nonce to avoid conflicts with in-flight txs
      const nonce = await this.provider.getTransactionCount(this.wallet.address, 'pending');
      console.log(`Funding ${address} with nonce ${nonce}`);

      const tx = await this.wallet.sendTransaction({
        to: address,
        value: ethers.parseEther(amountEth),
        nonce: nonce
      });
      await tx.wait();
      return tx.hash;
    } catch (error) {
      console.error('Fund wallet failed:', error);
      throw error;
    }
  }
  
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
      console.error('Failed to get stats:', error);
      throw error;
    }
  }
}