// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20, IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./interfaces/IDIGateway.sol";
import "./interfaces/IDIAOracle.sol";
import "./DIBridgedTokenRegistry.sol";
import "./DIBridgedToken.sol";

/**
 * @title DIGateway
 * @dev Updated gateway for omnichain bridging with CrossFi as hub
 */
contract DIGateway is IDIGateway, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using SignatureChecker for address;
    using ECDSA for bytes32;

    // Command types
    uint256 public constant COMMAND_APPROVE_CONTRACT_CALL = 0;
    uint256 public constant COMMAND_APPROVE_CONTRACT_CALL_WITH_MINT = 1;
    uint256 public constant COMMAND_SEND_TOKEN = 2;

    // Message types for CrossChainMessage event
    uint8 public constant MESSAGE_TYPE_CONTRACT_CALL = 0;
    uint8 public constant MESSAGE_TYPE_CONTRACT_CALL_WITH_TOKEN = 1;
    uint8 public constant MESSAGE_TYPE_TOKEN_TRANSFER = 2;

    uint32 public constant CROSSFI_CHAIN_ID = 4158; // Test - 4157, Main - 4158;

    DIBridgedTokenRegistry public bridgeTokenRegistry;
    EnumerableSet.AddressSet private relayers;

    mapping(address => bool) public whitelisted;
    mapping(bytes32 => bool) public commandExecuted;
    mapping(bytes32 => BridgeTXInfo) public bridgeTransactions;

    mapping(uint32 => bool) public supportedChains;
    mapping(string => TokenInfo) public supportedTokens;
    mapping(bytes32 => bytes) public approvedPayloads;
    string[] public tokenList;

    // Bridge fee management
    uint256 public feeInBps; // Fee in basis points (1 bps = 0.01%)
    address public feeReceiver;

    constructor(
        address tokenRegistry_,
        address owner_,
        uint256 feeInBps_,
        address feeReceiver_
    ) Ownable() {
        bridgeTokenRegistry = DIBridgedTokenRegistry(tokenRegistry_);
        _transferOwnership(owner_);

        require(feeInBps_ <= 10000, "Fee cannot exceed 100%");
        require(feeReceiver_ != address(0), "Invalid fee receiver");

        feeInBps = feeInBps_;
        feeReceiver = feeReceiver_;

        supportedChains[1] = true;
        supportedChains[56] = true;
        supportedChains[137] = true;
        supportedChains[CROSSFI_CHAIN_ID] = true;
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

    modifier nonZeroAmount(uint256 amount) {
        require(amount > 0, "Amount must be greater than zero");
        _;
    }

    modifier noZeroAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    modifier validContract(address addr) {
        require(
            addr != address(0) && addr.code.length != 0,
            "Invalid contract"
        );
        _;
    }

    modifier noZeroToken(address token) {
        require(token != address(0), "Invalid token");
        _;
    }

    modifier supportedChain(uint32 chainId) {
        require(supportedChains[chainId], "Unsupported chain");
        _;
    }

    modifier supportedToken(string memory symbol) {
        require(supportedTokens[symbol].supported, "Token not supported");
        _;
    }

    function _validateMint(
        address to,
        uint256 amount
    ) internal pure nonZeroAmount(amount) noZeroAddress(to) {}

    function _validateBurn(
        address from,
        uint256 amount
    ) internal pure nonZeroAmount(amount) noZeroAddress(from) {}

    function _validateLock(
        address from,
        uint256 amount,
        address token
    )
        internal
        pure
        nonZeroAmount(amount)
        noZeroAddress(from)
        noZeroToken(token)
    {}

    function _validateUnlock(
        address to,
        uint256 amount,
        address token
    )
        internal
        pure
        nonZeroAmount(amount)
        noZeroAddress(to)
        noZeroToken(token)
    {}

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

    // GMP Protocol Core Functions
    function callContract(
        uint32 destinationChainId,
        address destinationContractAddress,
        bytes memory payload
    )
        external
        supportedChain(destinationChainId)
        validContract(destinationContractAddress)
    {
        bytes32 payloadHash = keccak256(payload);

        emit CrossChainMessage(
            msg.sender,
            destinationChainId,
            destinationContractAddress,
            payloadHash,
            payload,
            "",
            0,
            MESSAGE_TYPE_CONTRACT_CALL
        );
    }

    function callContractWithToken(
        uint32 destinationChainId,
        address destinationContractAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    )
        external
        supportedChain(destinationChainId)
        supportedToken(symbol)
        nonZeroAmount(amount)
        validContract(destinationContractAddress)
    {
        _handleBurnAndLockToken(symbol, amount);
        bytes32 payloadHash = keccak256(payload);

        emit CrossChainMessage(
            msg.sender,
            destinationChainId,
            destinationContractAddress,
            payloadHash,
            payload,
            symbol,
            amount,
            MESSAGE_TYPE_CONTRACT_CALL_WITH_TOKEN
        );
    }

    function sendToken(
        uint32 destinationChainId,
        address destinationAddress,
        string memory symbol,
        uint256 amount
    )
        external
        supportedChain(destinationChainId)
        noZeroAddress(destinationAddress)
        supportedToken(symbol)
        nonZeroAmount(amount)
    {
        _handleBurnAndLockToken(symbol, amount);

        emit CrossChainMessage(
            msg.sender,
            destinationChainId,
            destinationAddress,
            bytes32(0),
            "",
            symbol,
            amount,
            MESSAGE_TYPE_TOKEN_TRANSFER
        );
    }

    function _handleBurnAndLockToken(
        string memory symbol,
        uint256 amount
    ) internal {
        address token = supportedTokens[symbol].token;
        
        if (supportedTokens[symbol].isBridged) {
            _burnToken(token, msg.sender, amount);
        } else {
            _lockToken(token, msg.sender, amount);
        }
        
    }

    // GMP Command Execution Functions (for relayers)
    function execute(
        bytes32 commandId,
        Command[] memory commands,
        bytes memory signature
    ) external onlyRelayer notExecuted(commandId) {
        commandExecuted[commandId] = true;

        bytes32 hash = keccak256(abi.encode(commandId, commands));
        address signer = recoverSigner(hash, signature);
        require(whitelisted[signer], "Invalid signer");

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
        } else if (command.commandType == COMMAND_SEND_TOKEN) {
            _sendToken(command.data);
        }
    }

    function _approveContractCall(
        bytes32 commandId,
        bytes memory data
    ) internal {
        (
            uint32 sourceChainId,
            address sourceAddress,
            address contractAddress,
            bytes32 payloadHash,
            bytes32 sourceTxHash,
            uint256 sourceEventIndex,
            bytes memory payload
        ) = abi.decode(
                data,
                (uint32, address, address, bytes32, bytes32, uint256, bytes)
            );

        require(keccak256(payload) == payloadHash, "Invalid payload hash");

        approvedPayloads[commandId] = payload;

        emit ContractCallApproved(
            commandId,
            sourceChainId,
            sourceAddress,
            contractAddress,
            payloadHash,
            sourceTxHash,
            sourceEventIndex
        );

        if (contractAddress.code.length > 0) {
            try
                this._safeExecuteCall(
                    commandId,
                    sourceChainId,
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
            uint32 sourceChainId,
            address sourceAddress,
            address contractAddress,
            bytes32 payloadHash,
            string memory symbol,
            uint256 amount,
            uint256 feeAmount,
            bytes32 sourceTxHash,
            uint256 sourceEventIndex,
            bytes memory payload
        ) = abi.decode(
                data,
                (
                    uint32,
                    address,
                    address,
                    bytes32,
                    string,
                    uint256,
                    uint256,
                    bytes32,
                    uint256,
                    bytes
                )
            );

        require(keccak256(payload) == payloadHash, "Invalid payload hash");
        approvedPayloads[commandId] = payload;

        _handleReleaseToken(contractAddress, symbol, amount, feeAmount);

        emit ContractCallApprovedWithMint(
            commandId,
            sourceChainId,
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
                    sourceChainId,
                    sourceAddress,
                    contractAddress,
                    payload,
                    symbol,
                    amount
                )
            {} catch {}
        }
    }

    function _sendToken(bytes memory data) internal {
        (
            address to,
            uint256 amount,
            uint256 feeAmount,
            string memory symbol
        ) = abi.decode(data, (address, uint256, uint256, string));

        _handleReleaseToken(to, symbol, amount, feeAmount);
    }

    function _handleReleaseToken(
        address target,
        string memory symbol,
        uint256 amount,
        uint256 feeAmount
    )
        internal
        noZeroAddress(target)
        nonZeroAmount(amount)
        supportedToken(symbol)
    {
        address token = supportedTokens[symbol].token;

        bool isBridged = supportedTokens[symbol].isBridged;
        if (isBridged) {
            _mintToken(token, target, amount);
            if (feeAmount > 0) {
                _mintToken(token, feeReceiver, feeAmount);
            }
        } else {
            _unlockToken(token, target, amount);
            if (feeAmount > 0) {
                _unlockToken(token, feeReceiver, feeAmount);
            }
        }
    
    }

    function _safeExecuteCall(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        address contractAddress,
        bytes memory payload
    ) external {
        require(msg.sender == address(this), "Only self");

        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature(
                "execute(bytes32,uint32,address,bytes)",
                commandId,
                sourceChainId,
                sourceAddress,
                payload
            )
        );

        require(success, "Contract call failed");
    }

    function _safeExecuteCallWithToken(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        address contractAddress,
        bytes memory payload,
        string memory symbol,
        uint256 amount
    ) external {
        require(msg.sender == address(this), "Only self");

        (bool success, ) = contractAddress.call(
            abi.encodeWithSignature(
                "executeWithToken(bytes32,uint32,address,bytes,string,uint256)",
                commandId,
                sourceChainId,
                sourceAddress,
                payload,
                symbol,
                amount
            )
        );

        require(success, "Contract call with token failed");
    }

    function _mintToken(address token, address to, uint256 amount) internal {
        _validateMint(to, amount);

        DIBridgedToken(token).mint(to, amount);
    }

    function _burnToken(address token, address from, uint256 amount) internal {
        _validateBurn(from, amount);

        DIBridgedToken(token).burn(from, amount);
    }

    function _lockToken(address token, address from, uint256 amount) internal {
        _validateLock(from, amount, token);

        IERC20(token).safeTransferFrom(from, address(this), amount);
    }

    function _unlockToken(address token, address to, uint256 amount) internal {
        _validateUnlock(to, amount, token);

        IERC20(token).safeTransfer(to, amount);
    }

    // Utility functions
    function recoverSigner(
        bytes32 _hash,
        bytes memory _signature
    ) internal pure returns (address) {
        bytes32 ethSignedMessageHash = _hash.toEthSignedMessageHash();
        return ethSignedMessageHash.recover(_signature);
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

    function addChain(uint32 chainId) external onlyOwner {
        require(!supportedChains[chainId], "Already added");
        supportedChains[chainId] = true;
    }

    function setBridgeFee(uint256 _feeInBps) external onlyOwner {
        require(_feeInBps <= 10000, "Fee cannot exceed 100%");
        feeInBps = _feeInBps;
        emit BridgeFeeUpdated(_feeInBps);
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
    ) external onlyOwner returns (address token) {
        // TODO: check if deploy logic is reasonable???
        require(supportedTokens[symbol].token == address(0), "Token exists");
        
        token = bridgeTokenRegistry.deploy(
            name,
            symbol,
            decimals,
            originChainId,
            originSymbol
        );

        emit TokenDeployed(symbol, address(token), originChainId, originSymbol);
        
        addToken(
            symbol,
            address(token),
            name,
            decimals,
            true
        );
    }
    
    function addToken(
        string memory symbol,
        address contractAddress,
        string memory name,
        uint8 decimals,
        bool isBridged
    ) public onlyOwner {
        require(!supportedTokens[symbol].supported, "Token already supported");
        supportedTokens[symbol] = TokenInfo(
            contractAddress,
            name,
            symbol,
            decimals,
            true,
            isBridged
        );
        tokenList.push(symbol);
        emit TokenAdded(symbol);
    }

    function removeToken(
        string memory symbol
    ) external supportedToken(symbol) onlyOwner {
        supportedTokens[symbol].supported = false;
        supportedTokens[symbol].token = address(0);

        for (uint256 i = 0; i < tokenList.length; i++) {
            if (keccak256(bytes(tokenList[i])) == keccak256(bytes(symbol))) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }

        emit TokenRemoved(symbol);
    }

    // View functions
    function getBridgeFee() external view returns (uint256) {
        return feeInBps;
    }

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

    function getSupportedTokens()
        external
        view
        returns (TokenInfo[] memory tokens)
    {
        tokens = new TokenInfo[](tokenList.length);

        for (uint256 i = 0; i < tokenList.length; i++) {
            string memory symbol = tokenList[i];
            tokens[i] = supportedTokens[symbol];
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
        return supportedTokens[symbol].token;
    }
}
