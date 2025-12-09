// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./DIGateway.sol";

/**
 * @title BridgeMonitor
 * @dev Health monitoring system for bridge operations
 */
contract BridgeMonitor is Ownable {
    DIGateway public gateway;
    
    struct TransactionStatus {
        bool exists;
        bool completed;
        bool failed;
        uint256 lastUpdated;
        string failureReason;
    }
    
    mapping(bytes32 => TransactionStatus) public transactionStatus;
    mapping(uint32 => uint256) public chainHealthScore; // 0-100
    
    uint256 public constant TRANSACTION_TIMEOUT = 1 hours;
    uint256 public constant HEALTH_CHECK_INTERVAL = 10 minutes;
    
    event TransactionStuck(bytes32 indexed txId, uint256 timeStuck);
    event TransactionFailed(bytes32 indexed txId, string reason);
    event ChainHealthUpdated(uint32 indexed chainId, uint256 score);
    event EmergencyRecoveryTriggered(bytes32 indexed txId, string action);
    
    constructor(address gateway_, address owner_) Ownable() {
        gateway = DIGateway(gateway_);
        _transferOwnership(owner_);
    }
    
    function updateTransactionStatus(
        bytes32 txId,
        bool completed,
        bool failed,
        string memory failureReason
    ) external onlyOwner {
        transactionStatus[txId] = TransactionStatus({
            exists: true,
            completed: completed,
            failed: failed,
            lastUpdated: block.timestamp,
            failureReason: failureReason
        });
        
        if (failed) {
            emit TransactionFailed(txId, failureReason);
        }
    }
    
    function checkStuckTransactions(bytes32[] calldata txIds) external view returns (bytes32[] memory) {
        bytes32[] memory stuckTxs = new bytes32[](txIds.length);
        uint256 stuckCount = 0;
        
        for (uint256 i = 0; i < txIds.length; i++) {
            TransactionStatus memory status = transactionStatus[txIds[i]];
            if (status.exists && !status.completed && !status.failed) {
                if (block.timestamp - status.lastUpdated > TRANSACTION_TIMEOUT) {
                    stuckTxs[stuckCount] = txIds[i];
                    stuckCount++;
                }
            }
        }
        
        // Resize array
        bytes32[] memory result = new bytes32[](stuckCount);
        for (uint256 i = 0; i < stuckCount; i++) {
            result[i] = stuckTxs[i];
        }
        
        return result;
    }
    
    function updateChainHealth(uint32 chainId, uint256 score) external onlyOwner {
        require(score <= 100, "Invalid score");
        chainHealthScore[chainId] = score;
        emit ChainHealthUpdated(chainId, score);
    }
    
    function triggerEmergencyRecovery(bytes32 txId, string memory action) external onlyOwner {
        emit EmergencyRecoveryTriggered(txId, action);
    }
    
    function getTransactionStatus(bytes32 txId) external view returns (TransactionStatus memory) {
        return transactionStatus[txId];
    }
    
    function isTransactionStuck(bytes32 txId) external view returns (bool) {
        TransactionStatus memory status = transactionStatus[txId];
        return status.exists && 
               !status.completed && 
               !status.failed && 
               (block.timestamp - status.lastUpdated > TRANSACTION_TIMEOUT);
    }
}