// contracts/script/Interact.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "../src/TradeVerifier.sol";

/// @notice Demonstrates single trade verification AND Merkle batch commit.
///         Run with:
///   forge script script/Interact.s.sol --rpc-url $RPC_URL --broadcast
contract InteractScript is Script {
    function run() external {
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");
        TradeVerifier verifier = TradeVerifier(contractAddress);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address user = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // ── 1. Single trade verification ────────────────────────────────────
        string memory symbol   = "BTCUSD";
        uint256 price          = 67000;
        uint256 quantity       = 1e17; // 0.1 BTC in smallest unit

        bytes32 tradeHash = keccak256(
            abi.encode(
                bytes("trade"),
                block.timestamp,
                user,
                keccak256(bytes(symbol)),
                price,
                quantity
            )
        );

        console.log("=== Single Trade Verify ===");
        console.log("Symbol:    ", symbol);
        console.log("Price:     ", price);
        console.log("Quantity:  ", quantity);
        console.log("TradeHash: ", vm.toString(tradeHash));

        verifier.verifyTrade(tradeHash);
        console.log("Trade verified on-chain!");

        TradeVerifier.TradeProof memory proof = verifier.getTradeProof(tradeHash);
        console.log("Block:          ", proof.blockNumber);
        console.log("Timestamp:      ", proof.timestamp);
        console.log("Previous hash:  ", vm.toString(proof.previousHash));

        _demoMerkleBatch(verifier);
        _printStats(verifier);

        vm.stopBroadcast();
    }

    function _demoMerkleBatch(TradeVerifier verifier) internal {
        address user = msg.sender;
        bytes32 h1 = keccak256(abi.encode("trade", block.timestamp + 1, user, keccak256("ETHUSD"), 3200,  5e17));
        bytes32 h2 = keccak256(abi.encode("trade", block.timestamp + 2, user, keccak256("SOLUSD"), 180,   2e18));
        bytes32 h3 = keccak256(abi.encode("trade", block.timestamp + 3, user, keccak256("BTCUSD"), 67100, 5e15));

        bytes32 leaf1 = keccak256(bytes.concat(keccak256(abi.encode(h1))));
        bytes32 leaf2 = keccak256(bytes.concat(keccak256(abi.encode(h2))));
        bytes32 leaf3 = keccak256(bytes.concat(keccak256(abi.encode(h3))));

        bytes32 merkleRoot = _buildRoot3(leaf1, leaf2, leaf3);

        console.log("\n=== Merkle Batch Commit ===");
        console.log("Batch trades:  3");
        console.log("Merkle root:   ", vm.toString(merkleRoot));

        verifier.submitMerkleRoot(merkleRoot, 3, "2026-02-23-batch-001");
        console.log("Merkle root committed on-chain!");

        TradeVerifier.MerkleRoot memory mr = verifier.getMerkleRoot(merkleRoot);
        console.log("Batch ID:      ", mr.batchId);
        console.log("Trade count:   ", mr.tradeCount);
    }

    function _buildRoot3(bytes32 a, bytes32 b, bytes32 c) internal pure returns (bytes32) {
        (bytes32 lo, bytes32 hi) = a < b ? (a, b) : (b, a);
        bytes32 parent = keccak256(abi.encodePacked(lo, hi));
        (lo, hi) = c < parent ? (c, parent) : (parent, c);
        return keccak256(abi.encodePacked(lo, hi));
    }

    function _printStats(TradeVerifier verifier) internal view {
        (uint256 total, uint256 users, bytes32 lastHash, uint256 lastTs) = verifier.getStats();
        console.log("\n=== Platform Stats ===");
        console.log("Total trades:  ", total);
        console.log("Total users:   ", users);
        console.log("Last hash:     ", vm.toString(lastHash));
        console.log("Last tx time:  ", lastTs);
        console.log("Merkle batches:", verifier.totalMerkleBatches());
    }
}
