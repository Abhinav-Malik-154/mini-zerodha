// contracts/test/TradeVerifier.t.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "forge-std/Test.sol";
import "../src/TradeVerifier.sol";

contract TradeVerifierTest is Test {
    TradeVerifier public verifier;
    address public user1 = address(0x123);
    address public user2 = address(0x456);
    address public owner;
    
    bytes32 public trade1 = keccak256("trade-1");
    bytes32 public trade2 = keccak256("trade-2");
    bytes32 public trade3 = keccak256("trade-3");
    
    function setUp() public {
        owner = address(this);
        verifier = new TradeVerifier();
    }
    
    // Test single verification
    function testVerifyTrade() public {
        vm.prank(owner);
        verifier.verifyTrade(trade1, user1);
        
        TradeVerifier.TradeProof memory proof = verifier.getTradeProof(trade1);
        assertTrue(proof.exists);
        assertEq(proof.trader, user1);
        assertEq(verifier.getTradeCount(user1), 1);
    }
    
    // Test batch verification
    function testBatchVerify() public {
        bytes32[] memory trades = new bytes32[](3);
        trades[0] = trade1;
        trades[1] = trade2;
        trades[2] = trade3;
        
        vm.prank(owner);
        verifier.batchVerify(trades, user1);
        
        TradeVerifier.TradeProof memory proof1 = verifier.getTradeProof(trade1);
        TradeVerifier.TradeProof memory proof2 = verifier.getTradeProof(trade2);
        TradeVerifier.TradeProof memory proof3 = verifier.getTradeProof(trade3);
        
        assertTrue(proof1.exists);
        assertTrue(proof2.exists);
        assertTrue(proof3.exists);
        assertEq(verifier.getTradeCount(user1), 3);
    }
    
    // FIXED: Test cannot verify same trade twice
    function test_RevertWhen_TradeAlreadyVerified() public {
        vm.prank(owner);
        verifier.verifyTrade(trade1, user1);
        
        vm.prank(owner);
        vm.expectRevert(TradeVerifier.TradeAlreadyVerified.selector);
        verifier.verifyTrade(trade1, user1);
    }
    
    // Test chain linking
    function testDeterministicOrdering() public {
        vm.startPrank(owner);
        verifier.verifyTrade(trade1, user1);
        verifier.verifyTrade(trade2, user1);
        vm.stopPrank();
        
        TradeVerifier.TradeProof memory proof1 = verifier.getTradeProof(trade1);
        TradeVerifier.TradeProof memory proof2 = verifier.getTradeProof(trade2);
        
        assertEq(proof2.previousHash, trade1);
        assertEq(proof1.previousHash, bytes32(0));
    }
    
    // Test pagination
    function testPagination() public {
        vm.startPrank(owner);
        for(uint i = 0; i < 10; i++) {
            verifier.verifyTrade(keccak256(abi.encodePacked(i)), user1);
        }
        vm.stopPrank();
        
        bytes32[] memory first5 = verifier.getUserTrades(user1, 0, 5);
        assertEq(first5.length, 5);
        
        bytes32[] memory next5 = verifier.getUserTrades(user1, 5, 5);
        assertEq(next5.length, 5);
    }
    
    // Test gas costs
    function testGasCosts() public {
        vm.startPrank(owner);
        
        uint256 gasStart = gasleft();
        verifier.verifyTrade(trade1, user1);
        uint256 singleGas = gasStart - gasleft();
        
        bytes32[] memory trades = new bytes32[](3);
        trades[0] = keccak256("a");
        trades[1] = keccak256("b");
        trades[2] = keccak256("c");
        
        gasStart = gasleft();
        verifier.batchVerify(trades, user1);
        uint256 batchGas = gasStart - gasleft();
        
        console.log("Single verify gas:", singleGas);
        console.log("Batch verify gas (3 trades):", batchGas);
        console.log("Gas per trade in batch:", batchGas / 3);
        
        assertLt(batchGas / 3, singleGas);
        vm.stopPrank();
    }
    
    // Test owner can revoke
    function testRevokeTrade() public {
        vm.prank(owner);
        verifier.verifyTrade(trade1, user1);
        
        TradeVerifier.TradeProof memory proofBefore = verifier.getTradeProof(trade1);
        assertTrue(proofBefore.exists);
        
        vm.prank(owner);
        verifier.revokeTrade(trade1);
        
        // getTradeProof now uses InvalidTradeHash custom error (not a string revert)
        vm.expectRevert(TradeVerifier.InvalidTradeHash.selector);
        verifier.getTradeProof(trade1);
    }
    
    // FIXED: Test non-owner cannot revoke
    function test_RevertWhen_NonOwnerRevokes() public {
        vm.prank(owner);
        verifier.verifyTrade(trade1, user1);
        
        vm.prank(user2);
        // This matches the actual OpenZeppelin v5+ error
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user2));
        verifier.revokeTrade(trade1);
    }
    
    // Test multiple users
    function testMultipleUsers() public {
        vm.startPrank(owner);
        verifier.verifyTrade(trade1, user1);
        verifier.verifyTrade(trade2, user2);
        vm.stopPrank();
        
        assertEq(verifier.getTradeCount(user1), 1);
        assertEq(verifier.getTradeCount(user2), 1);
        assertEq(verifier.totalTrades(), 2);
    }
    
    // Test stats function - FIXED
    function testStats() public {
        vm.prank(owner);
        verifier.verifyTrade(trade1, user1);
        
        (
            uint256 totalTrades,
            uint256 totalUsers,
            bytes32 lastHash,
            uint256 lastTimestamp
        ) = verifier.getStats();
        
        assertEq(totalTrades, 1);
        assertEq(lastHash, trade1);
        assertEq(totalUsers, 1);
        assertTrue(lastTimestamp > 0);
        assertEq(lastTimestamp, block.timestamp);
    }

    // ─── Merkle root tests ────────────────────────────────────────────────────

    // Helper: build a 2-leaf Merkle tree manually for testing
    // Leaf = keccak256(bytes.concat(keccak256(abi.encode(tradeHash))))  (OZ double-hash)
    function _merkleLeaf(bytes32 h) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(h))));
    }

    // Root of a 2-leaf tree: keccak256(abi.encodePacked(left, right)) sorted
    function _merkleRoot2(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        (bytes32 left, bytes32 right) = a < b ? (a, b) : (b, a);
        return keccak256(abi.encodePacked(left, right));
    }

    function testSubmitMerkleRoot() public {
        bytes32 leafA = _merkleLeaf(trade1);
        bytes32 leafB = _merkleLeaf(trade2);
        bytes32 root  = _merkleRoot2(leafA, leafB);

        verifier.submitMerkleRoot(root, 2, "batch-001");

        TradeVerifier.MerkleRoot memory mr = verifier.getMerkleRoot(root);
        assertEq(mr.root,       root);
        assertEq(mr.tradeCount, 2);
        assertEq(mr.batchId,    "batch-001");
        assertTrue(mr.exists);
        assertEq(verifier.totalMerkleBatches(), 1);
    }

    function test_RevertWhen_DuplicateMerkleRoot() public {
        bytes32 leafA = _merkleLeaf(trade1);
        bytes32 leafB = _merkleLeaf(trade2);
        bytes32 root  = _merkleRoot2(leafA, leafB);

        verifier.submitMerkleRoot(root, 2, "batch-001");
        vm.expectRevert(TradeVerifier.MerkleRootAlreadySubmitted.selector);
        verifier.submitMerkleRoot(root, 2, "batch-001-dup");
    }

    function test_RevertWhen_ZeroMerkleRoot() public {
        vm.expectRevert(TradeVerifier.InvalidMerkleRoot.selector);
        verifier.submitMerkleRoot(bytes32(0), 2, "bad");
    }

    function testVerifyMerkleProof() public {
        bytes32 leafA = _merkleLeaf(trade1);
        bytes32 leafB = _merkleLeaf(trade2);
        bytes32 root  = _merkleRoot2(leafA, leafB);
        verifier.submitMerkleRoot(root, 2, "batch-001");

        // Proof for leafA: the sibling is leafB (sorted internally by MerkleProof.verify)
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafB < leafA ? leafB : leafB; // sibling

        // OZ MerkleProof.verify sorts internally, so proof[0] = the sibling leaf
        // For a 2-leaf tree: proof = [sibling]
        bool ok = verifier.verifyMerkleProof(root, proof, trade1);
        assertTrue(ok);

        // leafToRoot should be recorded
        assertEq(verifier.leafToRoot(leafA), root);
    }

    function test_RevertWhen_InvalidMerkleProof() public {
        bytes32 leafA = _merkleLeaf(trade1);
        bytes32 leafB = _merkleLeaf(trade2);
        bytes32 root  = _merkleRoot2(leafA, leafB);
        verifier.submitMerkleRoot(root, 2, "batch-001");

        // Wrong sibling → proof should fail
        bytes32[] memory badProof = new bytes32[](1);
        badProof[0] = keccak256("wrong");

        vm.expectRevert(TradeVerifier.InvalidMerkleProof.selector);
        verifier.verifyMerkleProof(root, badProof, trade1);
    }

    function test_RevertWhen_MerkleProofUnknownRoot() public {
        bytes32[] memory proof = new bytes32[](0);
        vm.expectRevert(TradeVerifier.InvalidMerkleRoot.selector);
        verifier.verifyMerkleProof(keccak256("unknown-root"), proof, trade1);
    }

    function testGetMerkleRoots() public {
        bytes32 leafA = _merkleLeaf(trade1);
        bytes32 leafB = _merkleLeaf(trade2);
        bytes32 root1 = _merkleRoot2(leafA, leafB);
        bytes32 root2 = _merkleRoot2(_merkleLeaf(trade3), _merkleLeaf(keccak256("trade-4")));

        verifier.submitMerkleRoot(root1, 2, "batch-001");
        verifier.submitMerkleRoot(root2, 2, "batch-002");

        bytes32[] memory roots = verifier.getMerkleRoots();
        assertEq(roots.length, 2);
        assertEq(roots[0], root1);
        assertEq(roots[1], root2);
    }

    // Fuzz: any non-zero hash can be individually verified
    function testFuzz_AnyHashVerifies(bytes32 h) public {
        vm.assume(h != bytes32(0));
        vm.prank(owner);
        verifier.verifyTrade(h, user1);
        assertTrue(verifier.getTradeProof(h).exists);
    }

    // Fuzz: zero hash always reverts (plain unit test — fuzz can't hit bytes32(0) reliably)
    function test_ZeroHashAlwaysReverts() public {
        vm.prank(owner);
        vm.expectRevert(TradeVerifier.InvalidTradeHash.selector);
        verifier.verifyTrade(bytes32(0), user1);
    }

    // Test pause functionality
    function testPausePreventsVerification() public {
        verifier.pause();
        vm.prank(owner);
        vm.expectRevert();  // Pausable: EnforcedPause
        verifier.verifyTrade(trade1, user1);
    }

    function testUnpauseRestoresVerification() public {
        verifier.pause();
        verifier.unpause();
        vm.prank(owner);
        verifier.verifyTrade(trade1, user1);
        assertTrue(verifier.getTradeProof(trade1).exists);
    }

    // Test batchVerify count fix — skipped hashes should NOT inflate count
    function testBatchVerifyCountIsAccurate() public {
        bytes32[] memory trades = new bytes32[](3);
        trades[0] = trade1;
        trades[1] = bytes32(0); // should be skipped
        trades[2] = trade2;

        vm.prank(owner);
        verifier.batchVerify(trades, user1);

        // Only 2 real hashes stored, not 3
        assertEq(verifier.userTradeCount(user1), 2);
        assertEq(verifier.totalTrades(), 2);
    }
}
