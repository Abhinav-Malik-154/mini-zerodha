// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title TradeVerifier
/// @notice On-chain audit trail for off-chain trades.
///         Supports single/batch hash verification and Merkle-root batch commits.
/// @dev Hash chain: every TradeProof stores the previousHash, giving a
///      tamper-evident ordering of all verified trades.
///      Merkle integration: N trades can be committed as one root (O(1) storage),
///      then individual proofs are verified with MerkleProof.verify (O(log N) gas).
contract TradeVerifier is Ownable, ReentrancyGuard, Pausable {
    // ─── Custom errors ────────────────────────────────────────────────────────
    error TradeAlreadyVerified();
    error InvalidTradeHash();
    error NoTradesToVerify();
    error InvalidMerkleRoot();
    error MerkleRootAlreadySubmitted();
    error InvalidMerkleProof();
    
    // ─── Structs ──────────────────────────────────────────────────────────────
    /// @notice Immutable proof stored for every individually verified trade.
    struct TradeProof {
        bytes32 tradeHash;
        uint256 timestamp;
        address trader;
        uint256 blockNumber;
        bytes32 previousHash;
        bool exists;
    }

    /// @notice Metadata stored for every Merkle batch commit.
    struct MerkleRoot {
        bytes32 root;
        uint256 timestamp;
        uint256 blockNumber;
        address submitter;
        uint256 tradeCount;  // number of leaves in this batch
        string  batchId;     // off-chain identifier (e.g. "2026-02-23-batch-1")
        bool    exists;
    }

    // ─── Mappings ─────────────────────────────────────────────────────────────
    mapping(bytes32 => TradeProof)  public proofs;
    mapping(address => bytes32[])   public userTrades;
    mapping(address => uint256)     public userTradeCount;
    mapping(address => bool)        private _isKnownUser;

    /// @dev merkle roots keyed by root hash
    mapping(bytes32 => MerkleRoot)  public merkleRoots;
    /// @dev all submitted roots in order
    bytes32[]                       public allMerkleRoots;
    /// @dev which root a leaf was first proven under (leaf → root)
    mapping(bytes32 => bytes32)     public leafToRoot;
    
    // ─── Events ───────────────────────────────────────────────────────────────
    event TradeVerified(bytes32 indexed tradeHash, address indexed trader, uint256 timestamp);
    event TradeBatchVerified(bytes32[] tradeHashes, address indexed trader);
    event TradeRevoked(bytes32 indexed tradeHash, address indexed admin);

    /// @notice Emitted when a Merkle root batch is committed on-chain
    event MerkleRootSubmitted(
        bytes32 indexed root,
        address indexed submitter,
        uint256 tradeCount,
        string  batchId,
        uint256 timestamp
    );
    /// @notice Emitted when an individual leaf is proven against a stored root
    event MerkleLeafVerified(
        bytes32 indexed root,
        bytes32 indexed leaf,
        address indexed verifier
    );

    // ─── State ────────────────────────────────────────────────────────────────
    bytes32 public lastTradeHash;
    uint256 public lastTradeTimestamp;   // BUG FIX: was returning block.timestamp (always "now")
    uint256 public totalTrades;
    uint256 public totalUniqueUsers;
    uint256 public totalMerkleBatches;

    constructor() Ownable(msg.sender) ReentrancyGuard() Pausable() {}

    // ─── Pause controls (circuit breaker) ────────────────────────────────────
    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    
    // ─── Single trade verification ────────────────────────────────────────────

    /// @notice Verifies a single trade hash and stores its proof on-chain.
    /// @param tradeHash keccak256(abi.encode(symbol, price, qty, side, trader, timestamp))
    function verifyTrade(bytes32 tradeHash) external nonReentrant whenNotPaused {
        if (tradeHash == bytes32(0)) revert InvalidTradeHash();
        if (proofs[tradeHash].exists) revert TradeAlreadyVerified();
        
        if (!_isKnownUser[msg.sender]) {
            _isKnownUser[msg.sender] = true;
            totalUniqueUsers++;
        }
        
        proofs[tradeHash] = TradeProof({
            tradeHash:    tradeHash,
            timestamp:    block.timestamp,
            trader:       msg.sender,
            blockNumber:  block.number,
            previousHash: lastTradeHash,
            exists:       true
        });
        
        userTrades[msg.sender].push(tradeHash);
        userTradeCount[msg.sender]++;
        lastTradeHash      = tradeHash;
        lastTradeTimestamp = block.timestamp;
        totalTrades++;
        
        emit TradeVerified(tradeHash, msg.sender, block.timestamp);
    }

    // ─── Batch verification ───────────────────────────────────────────────────

    /// @notice Verifies multiple trade hashes in a single transaction.
    /// @dev Skips zero-hashes and already-verified hashes silently.
    ///      Only counts hashes that were actually stored.
    function batchVerify(bytes32[] calldata tradeHashes) external nonReentrant whenNotPaused {
        if (tradeHashes.length == 0) revert NoTradesToVerify();
        
        if (!_isKnownUser[msg.sender]) {
            _isKnownUser[msg.sender] = true;
            totalUniqueUsers++;
        }

        uint256 verified = 0;   // BUG FIX: was adding tradeHashes.length unconditionally
        
        for (uint256 i = 0; i < tradeHashes.length;) {
            bytes32 h = tradeHashes[i];

            if (h != bytes32(0) && !proofs[h].exists) {
                proofs[h] = TradeProof({
                    tradeHash:    h,
                    timestamp:    block.timestamp,
                    trader:       msg.sender,
                    blockNumber:  block.number,
                    previousHash: lastTradeHash,
                    exists:       true
                });
                userTrades[msg.sender].push(h);
                lastTradeHash      = h;
                lastTradeTimestamp = block.timestamp;
                totalTrades++;
                verified++;
            }
            unchecked { ++i; }
        }
        
        userTradeCount[msg.sender] += verified;
        emit TradeBatchVerified(tradeHashes, msg.sender);
    }
    
    // ─── View helpers ─────────────────────────────────────────────────────────

    /// @notice Get a paginated slice of a user's verified trade hashes.
    function getUserTrades(address user, uint256 offset, uint256 limit)
        external view returns (bytes32[] memory)
    {
        bytes32[] storage allTrades = userTrades[user];
        uint256 total = allTrades.length;
        if (offset >= total) return new bytes32[](0);
        uint256 resultSize = (offset + limit > total) ? total - offset : limit;
        bytes32[] memory result = new bytes32[](resultSize);
        for (uint256 i = 0; i < resultSize;) {
            result[i] = allTrades[offset + i];
            unchecked { ++i; }
        }
        return result;
    }
    
    // ─── Admin ────────────────────────────────────────────────────────────────

    /// @notice Owner can revoke a fraudulent/erroneous trade proof.
    function revokeTrade(bytes32 tradeHash) external onlyOwner {
        if (!proofs[tradeHash].exists) revert InvalidTradeHash();   // BUG FIX: was require() string
        proofs[tradeHash].exists = false;
        // BUG FIX: decrement counters so stats stay accurate
        address trader = proofs[tradeHash].trader;
        if (userTradeCount[trader] > 0) userTradeCount[trader]--;
        if (totalTrades > 0) totalTrades--;
        emit TradeRevoked(tradeHash, msg.sender);
    }

    // ─── Merkle root batch commit ─────────────────────────────────────────────

    /// @notice Commits a Merkle root representing a batch of N trades.
    ///         Storing one root is O(1) storage regardless of batch size.
    /// @param  root       Root of the Merkle tree built from double-hashed trade hashes.
    ///                    Leaf format: keccak256(bytes.concat(keccak256(abi.encode(tradeHash))))
    ///                    This double-hash prevents second-preimage attacks.
    /// @param  tradeCount Number of leaves (trades) in the tree.
    /// @param  batchId    Off-chain batch identifier for indexing (e.g. "2026-02-23-001").
    function submitMerkleRoot(
        bytes32 root,
        uint256 tradeCount,
        string calldata batchId
    ) external onlyOwner whenNotPaused {
        if (root == bytes32(0))        revert InvalidMerkleRoot();
        if (merkleRoots[root].exists)  revert MerkleRootAlreadySubmitted();
        if (tradeCount == 0)           revert NoTradesToVerify();

        merkleRoots[root] = MerkleRoot({
            root:        root,
            timestamp:   block.timestamp,
            blockNumber: block.number,
            submitter:   msg.sender,
            tradeCount:  tradeCount,
            batchId:     batchId,
            exists:      true
        });

        allMerkleRoots.push(root);
        totalMerkleBatches++;

        emit MerkleRootSubmitted(root, msg.sender, tradeCount, batchId, block.timestamp);
    }

    /// @notice Verifies that a trade hash is included in a previously submitted Merkle batch.
    /// @param  root      The Merkle root to check against (must exist on-chain).
    /// @param  proof     Sibling hashes path from leaf to root (generated off-chain).
    /// @param  tradeHash The raw trade hash whose inclusion you want to prove.
    /// @return true if the proof is valid.
    /// @dev    Leaf is double-hashed: keccak256(bytes.concat(keccak256(abi.encode(tradeHash))))
    ///         This matches OpenZeppelin's MerkleProof library expectation and prevents
    ///         second-preimage attacks where an attacker crafts an internal node == a valid leaf.
    function verifyMerkleProof(
        bytes32        root,
        bytes32[] calldata proof,
        bytes32        tradeHash
    ) external returns (bool) {
        if (!merkleRoots[root].exists) revert InvalidMerkleRoot();

        // Double-hash the leaf — same pattern used by OZ StandardMerkleTree
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(tradeHash))));

        if (!MerkleProof.verify(proof, root, leaf)) revert InvalidMerkleProof();

        // Record which root this leaf was proven under (idempotent)
        if (leafToRoot[leaf] == bytes32(0)) {
            leafToRoot[leaf] = root;
        }

        emit MerkleLeafVerified(root, leaf, msg.sender);
        return true;
    }

    /// @notice Multi-proof variant: verify multiple leaves against the same root in one call.
    ///         Gas-efficient when checking several trades from the same batch.
    function verifyMerkleMultiProof(
        bytes32          root,
        bytes32[] calldata proof,
        bool[]    calldata proofFlags,
        bytes32[] calldata tradeHashes
    ) external returns (bool) {
        if (!merkleRoots[root].exists) revert InvalidMerkleRoot();

        bytes32[] memory leaves = new bytes32[](tradeHashes.length);
        for (uint256 i = 0; i < tradeHashes.length;) {
            leaves[i] = keccak256(bytes.concat(keccak256(abi.encode(tradeHashes[i]))));
            unchecked { ++i; }
        }

        if (!MerkleProof.multiProofVerify(proof, proofFlags, root, leaves))
            revert InvalidMerkleProof();

        for (uint256 i = 0; i < leaves.length;) {
            if (leafToRoot[leaves[i]] == bytes32(0)) leafToRoot[leaves[i]] = root;
            emit MerkleLeafVerified(root, leaves[i], msg.sender);
            unchecked { ++i; }
        }
        return true;
    }

    /// @notice Returns all submitted Merkle roots.
    function getMerkleRoots() external view returns (bytes32[] memory) {
        return allMerkleRoots;
    }

    /// @notice Returns metadata for a specific root.
    function getMerkleRoot(bytes32 root) external view returns (MerkleRoot memory) {
        if (!merkleRoots[root].exists) revert InvalidMerkleRoot();
        return merkleRoots[root];
    }
    
    /// @notice Returns the number of trades a user has verified.
    function getTradeCount(address user) external view returns (uint256) {
        return userTrades[user].length;
    }

    /// @notice Returns the full proof struct for a trade hash.
    function getTradeProof(bytes32 tradeHash) external view returns (TradeProof memory) {
        if (!proofs[tradeHash].exists) revert InvalidTradeHash();
        return proofs[tradeHash];
    }

    /// @notice Returns global platform statistics.
    /// @dev lastTimestamp is the block.timestamp of the most recent verifyTrade call,
    ///      NOT the current block timestamp (which was the original bug).
    function getStats() external view returns (
        uint256 totalVerifiedTrades,
        uint256 totalUsers,
        bytes32 lastHash,
        uint256 lastTimestamp
    ) {
        return (
            totalTrades,
            totalUniqueUsers,
            lastTradeHash,
            lastTradeTimestamp
        );
    }
}