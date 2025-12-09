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

    struct TokenInfo {
        bool supported;
        address contractAddress;
        string logoURI;
        address priceFeed;
        string priceKey;
        bool useDIAOracle; // true for DIAOracle (CrossFi), false for Chainlink
    }

    struct TokenData {
        string name;
        string symbol;
        uint8 decimals;
        address contractAddress;
        string logoURI;
        address priceFeed;
        string priceKey;
        uint256 price;
        uint8 priceDecimals;
    }

    event BridgeTransactionLogged(bytes32 indexed txId, BridgeTXInfo txInfo);
    event TokenLocked(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint32 destChainId
    );
    event TokenMinted(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint32 sourceChainId
    );
    event TokenBurned(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint32 destChainId
    );
    event TokenUnlocked(
        address indexed token,
        address indexed user,
        uint256 amount,
        uint32 sourceChainId
    );
    event RelayerAdded(address indexed relayer);
    event RelayerRemoved(address indexed relayer);

    // GMP Events
    event CrossChainMessage(
        address indexed sender,
        uint32 destinationChainId,
        address destinationAddress,
        bytes32 indexed payloadHash,
        bytes payload,
        string symbol,
        uint256 amount,
        uint8 messageType
    );
    event Executed(bytes32 indexed commandId);
    event ContractCallApproved(
        bytes32 indexed commandId,
        uint32 sourceChainId,
        address indexed sourceAddress,
        address indexed contractAddress,
        bytes32 payloadHash,
        bytes32 sourceTxHash,
        uint256 sourceEventIndex
    );
    event ContractCallApprovedWithMint(
        bytes32 indexed commandId,
        uint32 sourceChainId,
        address indexed sourceAddress,
        address indexed contractAddress,
        bytes32 payloadHash,
        string symbol,
        uint256 amount,
        bytes32 sourceTxHash,
        uint256 sourceEventIndex
    );
    event TokenAdded(string indexed symbol);
    event TokenRemoved(string indexed symbol);
    event BridgeFeeUpdated(uint256 feeInBps);
    event FeeReceiverUpdated(address indexed feeReceiver);

    function getBridgeTransaction(
        bytes32 txId
    ) external view returns (BridgeTXInfo memory);

    function isCommandExecuted(bytes32 txId) external view returns (bool);

    // GMP Functions
    function callContract(
        uint32 destinationChainId,
        address destinationContractAddress,
        bytes memory payload
    ) external;

    function callContractWithToken(
        uint32 destinationChainId,
        address destinationContractAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    ) external payable;

    function sendToken(
        uint32 destinationChainId,
        address destinationAddress,
        string memory symbol,
        uint256 amount
    ) external payable;

    function execute(
        bytes32 commandId,
        Command[] memory commands,
        bytes memory signature
    ) external;

    function validateContractCall(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes32 payloadHash
    ) external view returns (bool);

    function validateContractCallAndMint(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes32 payloadHash,
        string calldata symbol,
        uint256 amount
    ) external view returns (bool);

    function getApprovedPayload(
        bytes32 commandId
    ) external view returns (bytes memory);

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
