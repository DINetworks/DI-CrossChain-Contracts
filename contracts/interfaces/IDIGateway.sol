// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDIGateway {
    struct BridgeTXInfo {
        uint32 sourceChainId;
        uint32 destChainId;
        uint8 txType; // 0 = lock/mint, 1 = burn/unlock, 2 = message-only
        string symbol;
        string amount;
        bytes payload;
        bytes32 sourceTxHash;
        bytes32 destTxHash;
        uint32 timestamp;
    }
    
    struct Command {
        uint256 commandType;
        bytes data;
    }
    
    event BridgeTransactionLogged(bytes32 indexed txId, BridgeTXInfo txInfo);
    event TokenLocked(address indexed token, address indexed user, uint256 amount, uint32 destChainId);
    event TokenMinted(address indexed token, address indexed user, uint256 amount, uint32 sourceChainId);
    event TokenBurned(address indexed token, address indexed user, uint256 amount, uint32 destChainId);
    event TokenUnlocked(address indexed token, address indexed user, uint256 amount, uint32 sourceChainId);
    
    // GMP Events
    event ContractCall(address indexed sender, string destinationChain, string destinationContractAddress, bytes32 indexed payloadHash, bytes payload);
    event ContractCallWithToken(address indexed sender, string destinationChain, string destinationContractAddress, bytes32 indexed payloadHash, bytes payload, string symbol, uint256 amount);
    event TokenSent(address indexed sender, string destinationChain, string destinationAddress, string symbol, uint256 amount);
    event Executed(bytes32 indexed commandId);
    
    function getBridgeTransaction(bytes32 txId) external view returns (BridgeTXInfo memory);
    function isCommandExecuted(bytes32 txId) external view returns (bool);
    
    // GMP Functions
    function callContract(
        string memory destinationChain,
        string memory destinationContractAddress,
        bytes memory payload
    ) external;
    
    function callContractWithToken(
        string memory destinationChain,
        string memory destinationContractAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    ) external;
    
    function sendToken(
        string memory destinationChain,
        string memory destinationAddress,
        string memory symbol,
        uint256 amount
    ) external;
    
    function execute(
        bytes32 commandId,
        Command[] memory commands,
        bytes memory signature
    ) external;
    
    function validateContractCall(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash
    ) external view returns (bool);
    
    function validateContractCallAndMint(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash,
        string calldata symbol,
        uint256 amount
    ) external view returns (bool);
    
    function getApprovedPayload(bytes32 commandId) external view returns (bytes memory);
    
    // Direct bridge functions
    function lock(address token, uint256 amount, uint32 destChainId, address recipient) external;
    function unlock(address token, address recipient, uint256 amount) external;
    function mint(address token, address recipient, uint256 amount) external;
    function burn(address token, address from, uint256 amount) external;
    
    // Admin functions
    function addRelayer(address relayer) external;
    function removeRelayer(address relayer) external;
    function addChain(string memory chainName, uint32 chainId) external;
    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint32 originChainId,
        string memory originSymbol
    ) external returns (address);
    
    function getAllRelayers() external view returns (address[] memory);
    function logBridgeTransaction(
        bytes32 txId,
        uint32 sourceChainId,
        uint32 destChainId,
        uint8 txType,
        string memory symbol,
        string memory amount,
        bytes memory payload,
        bytes32 sourceTxHash,
        bytes32 destTxHash
    ) external;
}