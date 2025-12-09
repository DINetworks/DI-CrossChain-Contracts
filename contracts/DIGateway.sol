// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {
    IERC20,
    IERC20Metadata
} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {
    SignatureChecker
} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IDIAOracle.sol";
import "./DIBridgedTokenRegistry.sol";
import "./DIBridgedToken.sol";

/**
 * @title DIGateway
 * @dev Updated gateway for omnichain bridging with CrossFi as hub
 */
contract DIGateway is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using SignatureChecker for address;
    using ECDSA for bytes32;

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

    // GMP Protocol structures
    struct Command {
        uint256 commandType;
        bytes data;
    }

    DIBridgedTokenRegistry public tokenFactory;
    EnumerableSet.AddressSet private relayers;

    mapping(address => bool) public whitelisted;
    mapping(bytes32 => bool) public commandExecuted;
    mapping(bytes32 => BridgeTXInfo) public bridgeTransactions;
    mapping(string => uint32) public chainIds;
    mapping(uint32 => string) public chainNames;
    mapping(bytes32 => bytes) public approvedPayloads;

    // Token management
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

    mapping(string => TokenInfo) public supportedTokens;
    string[] public tokenList;

    // Bridge fee management
    uint256 public feeInBps; // Fee in basis points (1 bps = 0.01%)
    address public feeReceiver;
    mapping(address => uint256) public tokenPriceInUsd;

    // CrossFi chain ID
    uint32 public constant CROSSFI_CHAIN_ID = 4157;

    // Command types
    uint256 public constant COMMAND_APPROVE_CONTRACT_CALL = 0;
    uint256 public constant COMMAND_APPROVE_CONTRACT_CALL_WITH_MINT = 1;
    uint256 public constant COMMAND_BURN_TOKEN = 2;
    uint256 public constant COMMAND_MINT_TOKEN = 4;
    uint256 public constant COMMAND_LOCK_TOKEN = 5;
    uint256 public constant COMMAND_UNLOCK_TOKEN = 6;
    uint256 public constant COMMAND_SEND_NATIVE = 7;

    // Message types for CrossChainMessage event
    uint8 public constant MESSAGE_TYPE_CONTRACT_CALL = 0;
    uint8 public constant MESSAGE_TYPE_CONTRACT_CALL_WITH_TOKEN = 1;
    uint8 public constant MESSAGE_TYPE_TOKEN_TRANSFER = 2;

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
        string destinationChain,
        string destinationAddress,
        bytes32 indexed payloadHash,
        bytes payload,
        string symbol,
        uint256 amount,
        uint8 messageType
    );
    event Executed(bytes32 indexed commandId);
    event ContractCallApproved(
        bytes32 indexed commandId,
        string sourceChain,
        string sourceAddress,
        address indexed contractAddress,
        bytes32 indexed payloadHash,
        bytes32 sourceTxHash,
        uint256 sourceEventIndex
    );
    event ContractCallApprovedWithMint(
        bytes32 indexed commandId,
        string sourceChain,
        string sourceAddress,
        address indexed contractAddress,
        bytes32 indexed payloadHash,
        string symbol,
        uint256 amount,
        bytes32 sourceTxHash,
        uint256 sourceEventIndex
    );
    event TokenAdded(string indexed symbol);
    event TokenRemoved(string indexed symbol);
    event BridgeFeeUpdated(uint256 feeInBps);
    event FeeReceiverUpdated(address indexed feeReceiver);

    constructor(
        address tokenFactory_,
        address owner_,
        uint256 feeInBps_,
        address feeReceiver_
    ) Ownable() {
        tokenFactory = DIBridgedTokenRegistry(tokenFactory_);
        _transferOwnership(owner_);

        require(feeInBps_ <= 10000, "Fee cannot exceed 100%");
        require(feeReceiver_ != address(0), "Invalid fee receiver");
        
        feeInBps = feeInBps_;
        feeReceiver = feeReceiver_;

        // Initialize supported chains
        chainIds["crossfi"] = CROSSFI_CHAIN_ID;
        chainNames[CROSSFI_CHAIN_ID] = "crossfi";
        chainIds["ethereum"] = 1;
        chainNames[1] = "ethereum";
        chainIds["bsc"] = 56;
        chainNames[56] = "bsc";
        chainIds["polygon"] = 137;
        chainNames[137] = "polygon";
    }

    modifier onlyRelayer() {
        require(whitelisted[msg.sender], "Only relayer");
        _;
    }

    modifier onlyCrossFi() {
        require(block.chainid == CROSSFI_CHAIN_ID, "Only CrossFi");
        _;
    }

    modifier notExecuted(bytes32 commandId) {
        require(!commandExecuted[commandId], "Command already executed");
        _;
    }

    // CrossFi-specific: Log all bridge transactions
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
    ) external onlyRelayer onlyCrossFi {
        _logBridgeTransaction(
            txId,
            sourceChainId,
            destChainId,
            txType,
            symbol,
            amount,
            payload,
            sourceTxHash,
            destTxHash
        );
    }

    function _logBridgeTransaction(
        bytes32 txId,
        uint32 sourceChainId,
        uint32 destChainId,
        uint8 txType,
        string memory symbol,
        string memory amount,
        bytes memory payload,
        bytes32 sourceTxHash,
        bytes32 destTxHash
    ) internal {
        BridgeTXInfo memory txInfo = BridgeTXInfo({
            sourceChainId: sourceChainId,
            destChainId: destChainId,
            txType: txType,
            symbol: symbol,
            amount: amount,
            payload: payload,
            sourceTxHash: sourceTxHash,
            destTxHash: destTxHash,
            timestamp: uint32(block.timestamp)
        });

        bridgeTransactions[txId] = txInfo;
        emit BridgeTransactionLogged(txId, txInfo);
    }

    // Admin functions
    function addRelayer(address relayer) external onlyOwner {
        require(!whitelisted[relayer], "Already relayer");
        whitelisted[relayer] = true;
        relayers.add(relayer);
        emit RelayerAdded(relayer);
    }

    function removeRelayer(address relayer) external onlyOwner {
        require(whitelisted[relayer], "Not relayer");
        whitelisted[relayer] = false;
        relayers.remove(relayer);
        emit RelayerRemoved(relayer);
    }

    function addChain(
        string memory chainName,
        uint32 chainId
    ) external onlyOwner {
        chainIds[chainName] = chainId;
        chainNames[chainId] = chainName;
    }

    function setBridgeFee(uint256 _feeInBps) external onlyOwner {
        require(_feeInBps <= 10000, "Fee cannot exceed 100%");
        feeInBps = _feeInBps;
        emit BridgeFeeUpdated(_feeInBps);
    }

    function getBridgeFee() external view returns (uint256) {
        return feeInBps;
    }

    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint32 originChainId,
        string memory originSymbol
    ) external onlyOwner returns (address) {
        return
            tokenFactory.deploy(
                name,
                symbol,
                decimals,
                originChainId,
                originSymbol
            );
    }

    function addToken(
        string memory symbol,
        address contractAddress,
        string memory logoURI,
        address priceFeed,
        string memory priceKey,
        bool useDIAOracle
    ) external onlyOwner {
        _addToken(symbol, contractAddress, logoURI, priceFeed, priceKey, useDIAOracle);
    }

    function addTokenWithMetadata(
        string memory symbol,
        address contractAddress,
        string memory logoURI,
        address priceFeed,
        string memory priceKey,
        bool useDIAOracle
    ) external onlyOwner {
        _addToken(symbol, contractAddress, logoURI, priceFeed, priceKey, useDIAOracle);
    }

    function removeToken(string memory symbol) external onlyOwner {
        require(supportedTokens[symbol].supported, "Token not supported");
        supportedTokens[symbol].supported = false;
        supportedTokens[symbol].contractAddress = address(0);

        // Remove from array
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (keccak256(bytes(tokenList[i])) == keccak256(bytes(symbol))) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }

        emit TokenRemoved(symbol);
    }

    function _addToken(
        string memory symbol,
        address contractAddress,
        string memory logoURI,
        address priceFeed,
        string memory priceKey,
        bool useDIAOracle
    ) internal {
        require(!supportedTokens[symbol].supported, "Token already supported");
        supportedTokens[symbol] = TokenInfo({
            supported: true,
            contractAddress: contractAddress,
            logoURI: logoURI,
            priceFeed: priceFeed,
            priceKey: priceKey,
            useDIAOracle: useDIAOracle
        });
        tokenList.push(symbol);
        emit TokenAdded(symbol);
    }

    // View functions
    function getBridgeTransaction(
        bytes32 txId
    ) external view returns (BridgeTXInfo memory) {
        return bridgeTransactions[txId];
    }

    function isCommandExecuted(bytes32 txId) external view returns (bool) {
        return commandExecuted[txId];
    }

    function getAllRelayers() external view returns (address[] memory) {
        return relayers.values();
    }

    function getSupportedTokens() external view returns (TokenData[] memory tokens) {
        tokens = new TokenData[](tokenList.length);
        
        for (uint256 i = 0; i < tokenList.length; i++) {
            string memory symbol = tokenList[i];
            TokenInfo memory info = supportedTokens[symbol];
            address tokenAddr = info.contractAddress;
            
            string memory name;
            uint8 decimals;
            uint256 price;
            uint8 priceDecimals;
            
            if (tokenAddr == address(0)) {
                name = "Native Token";
                decimals = 18;
            } else {
                try IERC20Metadata(tokenAddr).name() returns (string memory _name) {
                    name = _name;
                } catch {
                    name = symbol;
                }
                
                try IERC20Metadata(tokenAddr).decimals() returns (uint8 _decimals) {
                    decimals = _decimals;
                } catch {
                    decimals = 18;
                }
            }
            
            try this.getTokenPrice(symbol) returns (uint256 _price, uint8 _priceDecimals) {
                price = _price;
                priceDecimals = _priceDecimals;
            } catch {
                price = 0;
                priceDecimals = 0;
            }
            
            tokens[i] = TokenData({
                name: name,
                symbol: symbol,
                decimals: decimals,
                contractAddress: tokenAddr,
                logoURI: info.logoURI,
                priceFeed: info.priceFeed,
                priceKey: info.priceKey,
                price: price,
                priceDecimals: priceDecimals
            });
        }
        
        return tokens;
    }

    function isTokenSupported(
        string memory symbol
    ) external view returns (bool) {
        return supportedTokens[symbol].supported;
    }

    function getTokenAddress(
        string memory symbol
    ) external view returns (address) {
        return supportedTokens[symbol].contractAddress;
    }

    // GMP Protocol Core Functions
    function callContract(
        string memory destinationChain,
        string memory destinationContractAddress,
        bytes memory payload
    ) external {
        require(
            chainIds[destinationChain] > 0,
            "Unsupported destination chain"
        );
        require(
            bytes(destinationContractAddress).length > 0,
            "Invalid destination address"
        );

        bytes32 payloadHash = keccak256(payload);

        emit CrossChainMessage(
            msg.sender,
            destinationChain,
            destinationContractAddress,
            payloadHash,
            payload,
            "",
            0,
            MESSAGE_TYPE_CONTRACT_CALL
        );
    }

    function callContractWithToken(
        string memory destinationChain,
        string memory destinationContractAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    ) external {
        require(
            chainIds[destinationChain] > 0,
            "Unsupported destination chain"
        );
        require(
            bytes(destinationContractAddress).length > 0,
            "Invalid destination address"
        );
        require(amount > 0, "Amount must be greater than zero");
        require(supportedTokens[symbol].supported, "Token not supported");

        // Get token address from factory
        address token = tokenFactory.getToken(uint32(block.chainid), symbol);
        require(token != address(0), "Token not found");

        // Burn tokens from sender
        DIBridgedToken(token).burn(msg.sender, amount);

        bytes32 payloadHash = keccak256(payload);

        emit CrossChainMessage(
            msg.sender,
            destinationChain,
            destinationContractAddress,
            payloadHash,
            payload,
            symbol,
            amount,
            MESSAGE_TYPE_CONTRACT_CALL_WITH_TOKEN
        );
    }

    function sendToken(
        string memory destinationChain,
        string memory destinationAddress,
        string memory symbol,
        uint256 amount
    ) external payable {
        require(
            chainIds[destinationChain] > 0,
            "Unsupported destination chain"
        );
        require(
            bytes(destinationAddress).length > 0,
            "Invalid destination address"
        );
        require(amount > 0, "Amount must be greater than zero");
        require(supportedTokens[symbol].supported, "Token not supported");

        address token = supportedTokens[symbol].contractAddress;
        
        if (token == address(0)) {
            // Native token - receive native token
            require(msg.value == amount, "Incorrect native token amount");
        } else {
            // Check if it's a bridged token
            try DIBridgedToken(token).isBridgedToken() returns (bool isBridged) {
                if (isBridged) {
                    // Bridged token - burn
                    DIBridgedToken(token).burn(msg.sender, amount);
                } else {
                    // Regular token - lock
                    IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
                }
            } catch {
                // Regular token - lock
                IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
            }
        }

        emit CrossChainMessage(
            msg.sender,
            destinationChain,
            destinationAddress,
            bytes32(0),
            "",
            symbol,
            amount,
            MESSAGE_TYPE_TOKEN_TRANSFER
        );
    }

    // GMP Command Execution Functions (for relayers)
    function execute(
        bytes32 commandId,
        Command[] memory commands,
        bytes memory signature
    ) external onlyRelayer notExecuted(commandId) {
        commandExecuted[commandId] = true;

        // Verify signature
        bytes32 hash = keccak256(abi.encode(commandId, commands));
        address signer = recoverSigner(hash, signature);
        require(whitelisted[signer], "Invalid signer");

        // Execute all commands
        for (uint256 i = 0; i < commands.length; i++) {
            _executeCommand(commandId, commands[i]);
        }

        emit Executed(commandId);
    }

    function _executeCommand(
        bytes32 commandId,
        Command memory command
    ) internal {
        if (command.commandType == COMMAND_APPROVE_CONTRACT_CALL) {
            _approveContractCall(commandId, command.data);
        } else if (
            command.commandType == COMMAND_APPROVE_CONTRACT_CALL_WITH_MINT
        ) {
            _approveContractCallWithMint(commandId, command.data);
        } else if (command.commandType == COMMAND_MINT_TOKEN) {
            _mintToken(command.data);
        } else if (command.commandType == COMMAND_BURN_TOKEN) {
            _burnToken(command.data);
        } else if (command.commandType == COMMAND_LOCK_TOKEN) {
            _lockToken(command.data);
        } else if (command.commandType == COMMAND_UNLOCK_TOKEN) {
            _unlockToken(command.data);
        } else if (command.commandType == COMMAND_SEND_NATIVE) {
            _sendNative(command.data);
        } else {
            revert("Unknown command type");
        }
    }

    function _approveContractCall(
        bytes32 commandId,
        bytes memory data
    ) internal {
        (
            string memory sourceChain,
            string memory sourceAddress,
            address contractAddress,
            bytes32 payloadHash,
            bytes32 sourceTxHash,
            uint256 sourceEventIndex,
            bytes memory payload
        ) = abi.decode(
                data,
                (string, string, address, bytes32, bytes32, uint256, bytes)
            );

        require(keccak256(payload) == payloadHash, "Invalid payload hash");

        approvedPayloads[commandId] = payload;

        emit ContractCallApproved(
            commandId,
            sourceChain,
            sourceAddress,
            contractAddress,
            payloadHash,
            sourceTxHash,
            sourceEventIndex
        );

        // Execute contract call if possible
        if (contractAddress.code.length > 0) {
            try
                this._safeExecuteCall(
                    commandId,
                    sourceChain,
                    sourceAddress,
                    contractAddress,
                    payload
                )
            {} catch {}
        }
    }

    function _approveContractCallWithMint(
        bytes32 commandId,
        bytes memory data
    ) internal {
        (
            string memory sourceChain,
            string memory sourceAddress,
            address contractAddress,
            bytes32 payloadHash,
            string memory symbol,
            uint256 amount,
            bytes32 sourceTxHash,
            uint256 sourceEventIndex,
            bytes memory payload
        ) = abi.decode(
                data,
                (
                    string,
                    string,
                    address,
                    bytes32,
                    string,
                    uint256,
                    bytes32,
                    uint256,
                    bytes
                )
            );

        require(keccak256(payload) == payloadHash, "Invalid payload hash");

        approvedPayloads[commandId] = payload;

        // Mint tokens to contract
        address token = tokenFactory.getToken(uint32(block.chainid), symbol);
        require(token != address(0), "Token not found");
        uint256 bridgeTransactionsFee = amount * feeInBps / 10_000;

        DIBridgedToken(token).mint(contractAddress, amount - bridgeTransactionsFee);
        DIBridgedToken(token).mint(feeReceiver, bridgeTransactionsFee);
        // DIBridgedToken(token).mint(contractAddress, amount);

        emit ContractCallApprovedWithMint(
            commandId,
            sourceChain,
            sourceAddress,
            contractAddress,
            payloadHash,
            symbol,
            amount,
            sourceTxHash,
            sourceEventIndex
        );

        // Execute contract call with token if possible
        if (contractAddress.code.length > 0) {
            try
                this._safeExecuteCallWithToken(
                    commandId,
                    sourceChain,
                    sourceAddress,
                    contractAddress,
                    payload,
                    symbol,
                    amount
                )
            {} catch {}
        }
    }

    function getTokenPrice(string memory symbol) public view returns (uint256 price, uint8 decimals) {
        TokenInfo memory info = supportedTokens[symbol];
        
        if (info.priceFeed == address(0)) {
            return (0, 0);
        }
        
        if (info.useDIAOracle) {
            // Use DIAOracle for CrossFi
            (uint128 priceValue, uint128 timestamp) = IDIAOracle(info.priceFeed).getValue(info.priceKey);
            require(timestamp > 0, "Invalid price timestamp");
            return (uint256(priceValue), 8); // DIA returns 8 decimals
        } else {
            // Use Chainlink AggregatorV3Interface
            (, int256 answer, , uint256 updatedAt, ) = AggregatorV3Interface(info.priceFeed).latestRoundData();
            require(answer > 0, "Invalid price");
            require(updatedAt > 0, "Invalid timestamp");
            uint8 priceFeedDecimals = AggregatorV3Interface(info.priceFeed).decimals();
            return (uint256(answer), priceFeedDecimals);
        }
    }

    function estimateBridgeFee(string memory symbol, uint256 amount) public view returns(uint256 fee, uint256 feeInUsd) {
        fee = amount * feeInBps / 10_000;
        
        TokenInfo memory info = supportedTokens[symbol];
        address token = info.contractAddress;
        
        if (token != address(0) && info.priceFeed != address(0)) {
            uint8 tokenDecimals = IERC20Metadata(token).decimals();
            (uint256 price, uint8 priceDecimals) = getTokenPrice(symbol);
            
            // Calculate fee in USD: (fee * price) / (10^tokenDecimals) * (10^6) / (10^priceDecimals)
            // Result in 6 decimals USD
            feeInUsd = (fee * price * 1e6) / (10 ** tokenDecimals) / (10 ** priceDecimals);
        } else {
            feeInUsd = 0;
        }
        
        return (fee, feeInUsd);
    }

    function _mintToken(bytes memory data) internal {
        (address to, uint256 amount, string memory symbol) = abi.decode(
            data,
            (address, uint256, string)
        );

        require(amount > 0, "Amount must be greater than zero");
        require(to != address(0), "Invalid recipient");

        address token = tokenFactory.getToken(uint32(block.chainid), symbol);
        require(token != address(0), "Token not found");

        DIBridgedToken(token).mint(to, amount);
    }

    function _burnToken(bytes memory data) internal {
        (address from, uint256 amount, string memory symbol) = abi.decode(
            data,
            (address, uint256, string)
        );

        require(amount > 0, "Amount must be greater than zero");
        require(from != address(0), "Invalid sender");

        address token = tokenFactory.getToken(uint32(block.chainid), symbol);
        require(token != address(0), "Token not found");

        DIBridgedToken(token).burn(from, amount);
    }

    function _lockToken(bytes memory data) internal {
        (address from, uint256 amount, address token) = abi.decode(
            data,
            (address, uint256, address)
        );

        require(amount > 0, "Amount must be greater than zero");
        require(from != address(0), "Invalid sender");
        require(token != address(0), "Invalid token");

        IERC20(token).safeTransferFrom(from, address(this), amount);
    }

    function _unlockToken(bytes memory data) internal {
        (address to, uint256 amount, address token) = abi.decode(
            data,
            (address, uint256, address)
        );

        require(amount > 0, "Amount must be greater than zero");
        require(to != address(0), "Invalid recipient");
        require(token != address(0), "Invalid token");

        IERC20(token).safeTransfer(to, amount);
    }

    function _sendNative(bytes memory data) internal {
        (address to, uint256 amount) = abi.decode(
            data,
            (address, uint256)
        );

        require(amount > 0, "Amount must be greater than zero");
        require(to != address(0), "Invalid recipient");
        require(address(this).balance >= amount, "Insufficient native balance");

        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Native token transfer failed");
    }

    function _safeExecuteCall(
        bytes32 commandId,
        string memory sourceChain,
        string memory sourceAddress,
        address contractAddress,
        bytes memory payload
    ) external {
        require(msg.sender == address(this), "Only self");

        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature(
                "execute(bytes32,string,string,bytes)",
                commandId,
                sourceChain,
                sourceAddress,
                payload
            )
        );

        require(success, "Contract call failed");
    }

    function _safeExecuteCallWithToken(
        bytes32 commandId,
        string memory sourceChain,
        string memory sourceAddress,
        address contractAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    ) external {
        require(msg.sender == address(this), "Only self");

        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature(
                "executeWithToken(bytes32,string,string,bytes,string,uint256)",
                commandId,
                sourceChain,
                sourceAddress,
                payload,
                symbol,
                amount
            )
        );

        require(success, "Contract call with token failed");
    }

    // Utility functions
    function isContractCallApproved(
        bytes32 commandId,
        string calldata,
        string calldata,
        address,
        bytes32
    ) external view returns (bool) {
        return commandExecuted[commandId];
    }

    function isContractCallAndMintApproved(
        bytes32 commandId,
        string calldata,
        string calldata,
        address,
        bytes32,
        string calldata,
        uint256
    ) external view returns (bool) {
        return commandExecuted[commandId];
    }

    function getApprovedPayload(
        bytes32 commandId
    ) external view returns (bytes memory) {
        return approvedPayloads[commandId];
    }

    function validateContractCall(
        bytes32 commandId,
        string calldata,
        string calldata,
        bytes32 payloadHash
    ) external view returns (bool) {
        if (!commandExecuted[commandId]) return false;
        bytes memory storedPayload = approvedPayloads[commandId];
        if (storedPayload.length == 0) return false;
        return keccak256(storedPayload) == payloadHash;
    }

    function validateContractCallAndMint(
        bytes32 commandId,
        string calldata,
        string calldata,
        bytes32 payloadHash,
        string calldata,
        uint256
    ) external view returns (bool) {
        if (!commandExecuted[commandId]) return false;
        bytes memory storedPayload = approvedPayloads[commandId];
        if (storedPayload.length == 0) return false;
        return keccak256(storedPayload) == payloadHash;
    }

    function recoverSigner(
        bytes32 _hash,
        bytes memory _signature
    ) public pure returns (address) {
        bytes32 ethSignedMessageHash = _hash.toEthSignedMessageHash();
        return ethSignedMessageHash.recover(_signature);
    }
}
