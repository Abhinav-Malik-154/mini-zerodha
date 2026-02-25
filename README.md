# TradePro — Blockchain-Verified Trading Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.13-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org/)
[![Foundry](https://img.shields.io/badge/Foundry-Forge%20%7C%20Anvil-FF6B6B)](https://book.getfoundry.sh/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A full-stack hybrid trading platform that combines centralized exchange speed with blockchain transparency. Every trade is cryptographically verified on-chain, wallet balances update in real-time, and portfolio history is persisted to MongoDB.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Smart Contract](#smart-contract)
- [API Endpoints](#api-endpoints)
- [How Trading Works](#how-trading-works)
- [Screenshots](#screenshots)
- [Testing](#testing)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

TradePro is a **hybrid trading platform** that brings blockchain verification to every trade. It operates like a traditional exchange (fast order matching, real-time price feeds, portfolio tracking) but records a cryptographic proof of every transaction on a local Ethereum chain via the `TradeVerifier` smart contract.

Users connect their MetaMask wallet, authenticate via signature-based login (no passwords), and trade BTC/USD, ETH/USD, and SOL/USD. **ETH serves as the settlement currency** — buying any asset deducts ETH from your wallet, selling credits ETH back.

---

## Architecture

```
┌──────────────────┐     WebSocket      ┌──────────────────┐
│                  │  ◄──────────────►  │                  │
│   Next.js 16     │     REST API       │   Express.js 5   │
│   Frontend       │  ◄──────────────►  │   Backend        │
│   (Port 3000)    │                    │   (Port 5000)    │
│                  │                    │                  │
│  • Trading UI    │                    │  • Auth (JWT)    │
│  • Portfolio     │                    │  • Trade Routes  │
│  • Wallet Mgmt   │                    │  • Blockchain    │
│  • Live Charts   │                    │    Service       │
└──────────────────┘                    └────────┬─────────┘
        │                                        │
        │ MetaMask RPC                           │ ethers.js
        ▼                                        ▼
┌──────────────────┐                    ┌──────────────────┐
│   Anvil          │                    │   MongoDB Atlas  │
│   Local Chain    │                    │                  │
│   (Port 8545)    │                    │  • Users         │
│                  │                    │  • Trades        │
│  TradeVerifier   │                    │  • Stats         │
│  Contract        │                    │                  │
└──────────────────┘                    └──────────────────┘
```

---

## Features

### Trading
- **Quick Trade** cards for BTC/USD, ETH/USD, SOL/USD with one-click buy/sell
- **Advanced Trade Form** with Market & Limit order types
- **Real-time prices** via WebSocket feed with 24h change % and volume
- **ETH settlement** — all trades deduct/credit ETH from your connected wallet

### Blockchain Verification
- Every trade generates a `keccak256` hash and is stored on-chain via `TradeVerifier`
- **Verification badges** on every transaction linking to the on-chain proof
- **Batch verification** and **Merkle root** support for gas-efficient bulk commits
- **Hash chain** — each proof stores `previousHash` for tamper-evident ordering
- Admin can **revoke** fraudulent trades; contract supports **pause/unpause**

### Wallet & Authentication
- **MetaMask integration** — connect, switch accounts, disconnect
- **Signature-based login** — no passwords, nonce-based replay protection
- **JWT sessions** (30-day expiry) with automatic token refresh
- **Live ETH balance** displayed in the header, auto-refreshes after trades
- **Faucet** — "Get 5 Test ETH" button for development

### Portfolio
- **Holdings tracker** — calculates positions from trade history with cost basis
- **P&L calculation** — real-time profit/loss per asset and total portfolio
- **Allocation percentages** with visual progress bars
- **Transaction history** — date, time, amount, price, total, and verification badge
- **Auto-refresh** — portfolio updates live when new trades are placed

### Dashboard
- **Interactive candlestick chart** (TradingView Lightweight Charts) with timeframes (1H–1Y)
- **Order book** with bids/asks and spread indicator
- **Recent trades** feed
- **Platform stats** — total volume, active trades, users

### AI/Stock Prediction
- **Dynamic prediction page** serves both crypto and equities using a LightGBM model + multi-agent analysis. Visit `/stocks/[symbol]` (e.g. `/stocks/AAPL`) after starting the ML backend to see charts, price history and recommendations. The previous `trade` page redirects to this view.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contract** | Solidity 0.8.13, OpenZeppelin (Ownable, ReentrancyGuard, Pausable, MerkleProof) |
| **Contract Tooling** | Foundry (Forge, Cast, Anvil), via-IR optimizer |
| **Backend** | Node.js, Express.js 5, TypeScript 5.9 |
| **Blockchain SDK** | ethers.js 6 |
| **Database** | MongoDB Atlas, Mongoose 9 ODM |
| **Auth** | JWT (jsonwebtoken), EIP-191 personal_sign |
| **Real-time** | WebSocket (Socket.io), custom price feed |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Charts** | Lightweight Charts (TradingView) |
| **Wallet** | MetaMask, wagmi 3, viem 2 |
| **Forms** | React Hook Form, Zod validation |

---

## Project Structure

```
trading-platform/
├── contracts/                 # Solidity smart contracts (Foundry)
│   ├── src/
│   │   └── TradeVerifier.sol  # Main contract — trade verification + Merkle batches
│   ├── test/
│   │   └── Tradeverifier.t.sol
│   ├── script/
│   │   ├── Deploy.s.sol       # Deployment script
│   │   └── Interact.s.sol     # Interaction helpers
│   └── foundry.toml
│
├── backend/                   # Express.js API server
│   └── src/
│       ├── server.ts          # Entry point — Express + WebSocket + security middleware
│       ├── routes/
│       │   ├── auth.routes.ts # Nonce generation, signature login, JWT, /me profile
│       │   └── trade.routes.ts# Trade verification, history, wallet queries, stats
│       ├── services/
│       │   ├── blockchain.service.ts  # ethers.js contract interaction + fundWallet
│       │   ├── database.service.ts    # MongoDB connection
│       │   └── websocket.service.ts   # Real-time price feed
│       ├── middleware/
│       │   └── authenticate.ts        # JWT verification middleware
│       ├── models/
│       │   ├── Trade.model.ts # Trade schema (symbol, side, price, qty, hashes)
│       │   └── User.model.ts  # User schema (walletAddress, nonce, stats)
│       └── abis/
│           └── TradeVerifier.json
│
├── frontend/                  # Next.js 16 application
│   └── src/
│       ├── app/
│       │   ├── layout.tsx     # Root layout with providers
│       │   ├── page.tsx       # Dashboard (home)
│       │   ├── trade/         # Trading page
│       │   ├── portfolio/     # Portfolio & transaction history
│       │   ├── markets/       # Market overview
│       │   ├── settings/      # User settings
│       │   └── help/          # Help page
│       ├── components/
│       │   ├── trading/       # QuickTrade, TradeForm, OrderBook, PriceTicker
│       │   ├── charts/        # DynamicTradingChart (candlestick + volume)
│       │   ├── layout/        # MainLayout, Sidebar, Header
│       │   ├── wallet/        # Wallet connection UI
│       │   └── ui/            # VerificationBadge, loading states
│       ├── context/
│       │   ├── WalletProvider.tsx  # MetaMask connection, balance, refresh
│       │   ├── AuthProvider.tsx    # JWT login/logout, user state
│       │   └── SymbolContext.tsx   # Shared selected trading pair
│       └── hooks/
│           ├── useWebSocket.ts    # WebSocket connection hook
│           ├── useRealTimeData.ts # Live price data hook
│           └── useErrorHandler.ts # Global error handling
│
└── docs/                      # Documentation
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v10+
- **Foundry** — [Install guide](https://book.getfoundry.sh/getting-started/installation)
- **MetaMask** browser extension
- **MongoDB Atlas** account (free tier works) or local MongoDB

### 1. Clone & Install

```bash
git clone https://github.com/Abhinav-Malik-154/trading-platform.git
cd trading-platform
```

### 2. Start Anvil (Local Blockchain)

```bash
anvil
```

Keep this terminal running. Anvil provides 10 pre-funded accounts on `http://127.0.0.1:8545` (Chain ID: 31337).

### 3. Deploy the Smart Contract

```bash
cd contracts
forge install
forge build

# Deploy to local Anvil
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

Note the deployed contract address from the output.

### 4. Configure & Start Backend

```bash
cd ../backend
npm install
cp .env.example .env   # Create env file, then edit it (see below)
npm run dev
```

Backend starts on `http://localhost:5000`.

### 5. Configure & Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend starts on `http://localhost:3000`.

### 6. Configure MetaMask

1. Open MetaMask → Settings → Networks → Add Network
2. Fill in:
   - **Network Name**: Anvil Local
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: ETH
3. Import an Anvil test account (use any private key from the Anvil startup output, **except** Account #0 which is the treasury)

### 7. Fund Your Wallet

In the app, click the wallet dropdown → **"Get 5 Test ETH"**, or run:

```bash
cast send YOUR_ADDRESS --value 10ether \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Anvil local chain
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5fbdb2315678afecb367f032d93f642f64180aa3

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/tradingPlatformDB

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secret_key_here
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_EXPECTED_CHAIN_ID=31337
```

---

## Smart Contract

### `TradeVerifier.sol`

The core contract provides:

| Function | Description |
|----------|-------------|
| `verifyTrade(hash, trader)` | Store a single trade proof on-chain |
| `batchVerify(hashes[], trader)` | Verify multiple trades in one TX |
| `submitMerkleRoot(root, count, batchId)` | Commit a Merkle root for gas-efficient batch verification |
| `verifyMerkleProof(root, proof[], hash)` | Prove trade inclusion in a Merkle batch |
| `verifyMerkleMultiProof(...)` | Verify multiple leaves against the same root |
| `getTradeProof(hash)` | Get full proof (timestamp, trader, block, previousHash) |
| `getUserTrades(user, offset, limit)` | Paginated user trade hashes |
| `getStats()` | Total trades, users, last hash, last timestamp |
| `revokeTrade(hash)` | Admin: remove a fraudulent trade |
| `pause()` / `unpause()` | Circuit breaker |

**Security**: Ownable (admin-only writes), ReentrancyGuard, Pausable, MerkleProof (OZ).

### Run Contract Tests

```bash
cd contracts
forge test -vvv
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/nonce/:address` | Get login nonce for wallet |
| `POST` | `/api/auth/login` | Submit signature, receive JWT |
| `GET` | `/api/auth/me` | Get current user profile (requires JWT) |

### Trades

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/trades/verify` | Submit & verify a trade (requires JWT) |
| `GET` | `/api/trades/wallet/:address` | Get trades by wallet address |
| `GET` | `/api/trades/history/:userId` | Get trade history with pagination |
| `GET` | `/api/trades/proof/:tradeHash` | Get on-chain proof for a trade |
| `GET` | `/api/trades/verified/:tradeHash` | Check if trade is verified |
| `GET` | `/api/trades/stats` | Platform-wide statistics |
| `GET` | `/api/trades/:tradeId` | Get single trade by DB ID |

### Faucet

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/faucet/fund` | Request test ETH (dev only) |

---

## How Trading Works

### Buy Flow (e.g., Buy 0.5 BTC at $51,000)

```
1. User clicks BUY → MetaMask popup asks to confirm ETH payment
   Cost = (0.5 × $51,000) / $3,100 per ETH ≈ 8.226 ETH

2. ETH transferred: User wallet → Treasury (Anvil Account #0)
   Wallet: 10 ETH → 1.774 ETH

3. Frontend sends POST /api/trades/verify with JWT token

4. Backend:
   a. Generates deterministic keccak256 trade hash
   b. Calls TradeVerifier.verifyTrade(hash, trader) on-chain
   c. Saves trade to MongoDB (symbol, side, price, qty, hashes)
   d. Returns transaction hash + trade proof

5. Frontend dispatches 'portfolio_updated' event
   → Portfolio page re-fetches trades from DB
   → Wallet balance auto-refreshes
```

### Sell Flow (e.g., Sell 0.5 BTC at $52,000)

```
1. User clicks SELL → No MetaMask popup needed

2. Backend:
   a. Verifies trade on-chain (same as buy)
   b. Calculates ETH proceeds: (0.5 × $52,000) / $3,100 ≈ 8.387 ETH
   c. Treasury sends ETH to user wallet via fundWallet()
   d. Saves trade to MongoDB

3. Wallet: 1.774 ETH → 10.161 ETH
```

---

## Screenshots

_Add screenshots of your running application here._

| Dashboard | Trading | Portfolio |
|-----------|---------|-----------|
| Live charts, order book, quick trade | Buy/Sell with wallet confirmation | Holdings, P&L, transaction history |

---

## Testing

### Smart Contract Tests

```bash
cd contracts
forge test -vvv
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### Manual E2E Test

1. Start all 3 services (Anvil, Backend, Frontend)
2. Connect MetaMask → Get test ETH
3. Buy some BTC → Confirm ETH leaves your wallet
4. Check Portfolio → Verify trade appears with timestamp
5. Sell BTC → Confirm ETH returns to wallet
6. Click the verification badge → View on-chain proof

---

## Roadmap

- [x] Smart contract — single & batch trade verification
- [x] Merkle tree batch commits for gas efficiency
- [x] Backend API with JWT authentication
- [x] MongoDB persistence for trades and users
- [x] Real-time WebSocket price feeds
- [x] Next.js frontend with trading UI
- [x] MetaMask wallet integration
- [x] ETH settlement — real balance changes on buy/sell
- [x] Portfolio tracking with P&L
- [x] Transaction history with date/time and verification badges
- [ ] Deployment to public testnet (Polygon Amoy / Sepolia)
- [ ] Limit order matching engine
- [ ] Trade notifications (WebSocket push)
- [ ] Mobile-responsive optimizations
- [ ] Multi-chain support

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

## Acknowledgements

- UI inspired by [Zerodha Kite](https://kite.zerodha.com/) and modern crypto exchanges
- Charts powered by [TradingView Lightweight Charts](https://github.com/nickvdyck/lightweight-charts)
- Smart contract security patterns from [OpenZeppelin](https://www.openzeppelin.com/)
- Local blockchain by [Foundry Anvil](https://book.getfoundry.sh/)

---

**Built by [Abhinav Malik](https://github.com/Abhinav-Malik-154)**
