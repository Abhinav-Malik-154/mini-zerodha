// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title TradeVerifier
 * @author
 * @notice On-chain audit trail for trades that happen off-chain.
 *         Each verified trade gets a tamper-evident proof (hash chain).
 *         Also supports committing merkle roots for batch verification.
 */
contract TradeVerifier is Ownable, ReentrancyGuard, Pausable {

    error TradeAlreadyVerified();
    error InvalidTradeHash();
    error NoTradesToVerify();
    error InvalidMerkleRoot();
    error MerkleRootAlreadySubmitted();
    error InvalidMerkleProof();

    struct TradeProof {
        bytes32 tradeHash;
        uint256 timestamp;
        address trader;
        uint256 blockNumber;
        bytes32 previousHash;   // links back to the previous trade, forming a chain
        bool exists;
    }

    struct MerkleRoot {
        bytes32 root;
        uint256 timestamp;
        uint256 blockNumber;
        address submitter;
        uint256 tradeCount;
        string  batchId;        // e.g. "2026-02-23-batch-1"
        bool    exists;
    }

    // trade hash -> proof
    mapping(bytes32 => TradeProof)  public proofs;
    mapping(address => bytes32[])   public userTrades;
    mapping(address => uint256)     public userTradeCount;
    mapping(address => bool)        private _isKnownUser;

    // merkle stuff
    mapping(bytes32 => MerkleRoot)  public merkleRoots;
    bytes32[]                       public allMerkleRoots;
    mapping(bytes32 => bytes32)     public leafToRoot;      // leaf -> which root it was proven under

    event TradeVerified(bytes32 indexed tradeHash, address indexed trader, uint256 timestamp);
    event TradeBatchVerified(bytes32[] tradeHashes, address indexed trader);
    event TradeRevoked(bytes32 indexed tradeHash, address indexed admin);

    event MerkleRootSubmitted(
        bytes32 indexed root,
        address indexed submitter,
        uint256 tradeCount,
        string  batchId,
        uint256 timestamp
    );

    event MerkleLeafVerified(
        bytes32 indexed root,
        bytes32 indexed leaf,
        address indexed verifier
    );

    bytes32 public lastTradeHash;
    uint256 public lastTradeTimestamp;
    uint256 public totalTrades;
    uint256 public totalUniqueUsers;
    uint256 public totalMerkleBatches;

    constructor() Ownable(msg.sender) ReentrancyGuard() Pausable() {}

    // circuit breaker - can pause everything if something goes wrong
    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    /// @notice Store a verified trade hash on-chain with its proof.
    /// @param tradeHash The keccak256 hash of the trade data
    /// @param trader Wallet address of the trader
    function verifyTrade(bytes32 tradeHash, address trader) external onlyOwner nonReentrant whenNotPaused {
        if (tradeHash == bytes32(0)) revert InvalidTradeHash();
        if (proofs[tradeHash].exists) revert TradeAlreadyVerified();
        if (trader == address(0)) revert("Invalid trader address");
        
        if (!_isKnownUser[trader]) {
            _isKnownUser[trader] = true;
            totalUniqueUsers++;
        }
        
        proofs[tradeHash] = TradeProof({
            tradeHash:    tradeHash,
            timestamp:    block.timestamp,
            trader:       trader,
            blockNumber:  block.number,
            previousHash: lastTradeHash,
            exists:       true
        });
        
        userTrades[trader].push(tradeHash);
        userTradeCount[trader]++;
        lastTradeHash      = tradeHash;
        lastTradeTimestamp = block.timestamp;
        totalTrades++;
        
        emit TradeVerified(tradeHash, trader, block.timestamp);
    }

    /// @notice Verify a batch of trades for one user in a single tx.
    ///         Silently skips zero-hashes and duplicates.
    function batchVerify(bytes32[] calldata tradeHashes, address trader) external onlyOwner nonReentrant whenNotPaused {
        if (tradeHashes.length == 0) revert NoTradesToVerify();
        if (trader == address(0)) revert("Invalid trader address");
        
        if (!_isKnownUser[trader]) {
            _isKnownUser[trader] = true;
            totalUniqueUsers++;
        }

        uint256 verified = 0;
        
        for (uint256 i = 0; i < tradeHashes.length;) {
            bytes32 h = tradeHashes[i];

            if (h != bytes32(0) && !proofs[h].exists) {
                proofs[h] = TradeProof({
                    tradeHash:    h,
                    timestamp:    block.timestamp,
                    trader:       trader,
                    blockNumber:  block.number,
                    previousHash: lastTradeHash,
                    exists:       true
                });
                userTrades[trader].push(h);
                lastTradeHash      = h;
                lastTradeTimestamp = block.timestamp;
                totalTrades++;
                verified++;
            }
            unchecked { ++i; }
        }
        
        userTradeCount[trader] += verified;
        emit TradeBatchVerified(tradeHashes, trader);
    }

    /// @notice Paginated view of a user's trade hashes
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

    /// @notice Revoke a trade proof (admin only, for fraud / errors)
    function revokeTrade(bytes32 tradeHash) external onlyOwner {
        if (!proofs[tradeHash].exists) revert InvalidTradeHash();
        proofs[tradeHash].exists = false;
        // keep stats accurate
        address trader = proofs[tradeHash].trader;
        if (userTradeCount[trader] > 0) userTradeCount[trader]--;
        if (totalTrades > 0) totalTrades--;
        emit TradeRevoked(tradeHash, msg.sender);
    }

    /// @notice Commit a merkle root for a batch of N trades (O(1) on-chain storage).
    ///         Leaves should be double-hashed: keccak256(bytes.concat(keccak256(abi.encode(tradeHash))))
    ///         to prevent second-preimage attacks.
    /// @param root       Merkle root
    /// @param tradeCount How many leaves in the tree
    /// @param batchId    Off-chain ID for this batch
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

    /// @notice Check that a trade hash is part of a previously submitted merkle batch.
    /// @dev Leaf = keccak256(bytes.concat(keccak256(abi.encode(tradeHash)))), matches OZ StandardMerkleTree
    function verifyMerkleProof(
        bytes32        root,
        bytes32[] calldata proof,
        bytes32        tradeHash
    ) external returns (bool) {
        if (!merkleRoots[root].exists) revert InvalidMerkleRoot();

        // double-hash the leaf (same as OZ StandardMerkleTree)
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(tradeHash))));

        if (!MerkleProof.verify(proof, root, leaf)) revert InvalidMerkleProof();

        // track which root proved this leaf (only first time)
        if (leafToRoot[leaf] == bytes32(0)) {
            leafToRoot[leaf] = root;
        }

        emit MerkleLeafVerified(root, leaf, msg.sender);
        return true;
    }

    /// @notice Multi-proof: verify several leaves against the same root at once.
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

    /// @notice All merkle roots submitted so far
    function getMerkleRoots() external view returns (bytes32[] memory) {
        return allMerkleRoots;
    }

    /// @notice Get info about a specific merkle root
    function getMerkleRoot(bytes32 root) external view returns (MerkleRoot memory) {
        if (!merkleRoots[root].exists) revert InvalidMerkleRoot();
        return merkleRoots[root];
    }
    
    function getTradeCount(address user) external view returns (uint256) {
        return userTrades[user].length;
    }

    function getTradeProof(bytes32 tradeHash) external view returns (TradeProof memory) {
        if (!proofs[tradeHash].exists) revert InvalidTradeHash();
        return proofs[tradeHash];
    }

    // returns (totalTrades, totalUsers, lastHash, lastTimestamp)
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