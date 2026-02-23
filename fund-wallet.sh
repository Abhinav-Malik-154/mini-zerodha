#!/bin/bash

# Default Anvil Private Key (Account #0)
SENDER_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
RPC_URL="http://127.0.0.1:8545"

if [ -z "$1" ]; then
  echo "Usage: ./fund-wallet.sh <YOUR_WALLET_ADDRESS> [AMOUNT]"
  echo "Example: ./fund-wallet.sh 0x123... 10ether"
  exit 1
fi

RECIPIENT=$1
AMOUNT=${2:-10ether}

echo "💸 Funding $RECIPIENT with $AMOUNT ETH..."

cast send "$RECIPIENT" --value "$AMOUNT" --private-key "$SENDER_KEY" --rpc-url "$RPC_URL"

if [ $? -eq 0 ]; then
  echo "✅ Success! Funds sent."
  echo "💰 New Balance:"
  cast balance "$RECIPIENT" --rpc-url "$RPC_URL"
else
  echo "❌ Failed to send funds. Is Anvil running?"
fi
