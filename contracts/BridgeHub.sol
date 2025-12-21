// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title BridgeHub
 * @dev Central hub contract deployed on HyperEVM for managing bridge operations
 * Logs important events from all chains and maintains supported chain/token registry
 */
contract BridgeHub is Ownable {
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    struct ChainInfo {
        uint32 chainId;
        string name;
        string rpcUrl;
        address gatewayAddress;
        address gasCreditVault;
        address metaTxGateway;
        bool isActive;
        uint256 addedAt;
    }

    struct TokenDetail {
        address tokenAddress;
        string name;
        string symbol;
        uint8 decimals;
        uint32 originChainId;
        string originSymbol;
        bool isDeployed;
    }

    struct TokenInfo {
        string symbol;
        string name;
        uint8 decimals;
        mapping(uint32 => TokenDetail) contractAddresses; // chainId => TokenDetail
        bool isSupported;
        uint256 addedAt;
    }

    struct BridgeEvent {
        bytes32 eventId;
        uint32 sourceChainId;
        uint32 destinationChainId;
        address sourceAddress;
        address destinationAddress;
        string tokenSymbol;
        uint256 amount;
        bytes32 txHash;
        uint8 eventType; // 0: ContractCall, 1: ContractCallWithToken, 2: TokenTransfer
        uint256 timestamp;
        bytes payload;
    }

    struct DetailedChainInfo {
        ChainInfo chainInfo;
        TokenDetail[] tokens;
    }

    // Storage
    mapping(uint32 => ChainInfo) public supportedChains;
    mapping(string => TokenInfo) private tokenRegistry;
    mapping(bytes32 => BridgeEvent) public bridgeEvents;
    
    EnumerableSet.UintSet private chainIds;
    EnumerableSet.Bytes32Set private eventIds;
    string[] public tokenSymbols;

    // Events
    event ChainAdded(uint32 indexed chainId, string name, address gatewayAddress);
    event ChainUpdated(uint32 indexed chainId, string name, address gatewayAddress);
    event ChainDeactivated(uint32 indexed chainId);
    
    event TokenAdded(string indexed symbol, string name, uint8 decimals);
    event TokenContractAdded(string indexed symbol, uint32 indexed chainId, address contractAddress);
    event TokenDeactivated(string indexed symbol);
    
    event BridgeEventLogged(
        bytes32 indexed eventId,
        uint32 indexed sourceChainId,
        uint32 indexed destinationChainId,
        string tokenSymbol,
        uint256 amount
    );

    constructor() Ownable() {}

    // Chain Management
    function addChain(
        uint32 chainId,
        string memory name,
        string memory rpcUrl,
        address gatewayAddress,
        address gasCreditVault,
        address metaTxGateway
    ) external onlyOwner {
        require(chainId != 0, "Invalid chain ID");
        require(bytes(name).length > 0, "Invalid name");

        supportedChains[chainId] = ChainInfo({
            chainId: chainId,
            name: name,
            rpcUrl: rpcUrl,
            gatewayAddress: gatewayAddress,
            gasCreditVault: gasCreditVault,
            metaTxGateway: metaTxGateway,
            isActive: true,
            addedAt: block.timestamp
        });

        chainIds.add(chainId);
        emit ChainAdded(chainId, name, gatewayAddress);
    }

    function updateChain(
        uint32 chainId,
        string memory name,
        string memory rpcUrl,
        address gatewayAddress,
        address gasCreditVault,
        address metaTxGateway
    ) external onlyOwner {
        require(chainIds.contains(chainId), "Chain not supported");
        
        ChainInfo storage chain = supportedChains[chainId];
        chain.name = name;
        chain.rpcUrl = rpcUrl;
        chain.gatewayAddress = gatewayAddress;
        chain.gasCreditVault = gasCreditVault;
        chain.metaTxGateway = metaTxGateway;
        
        emit ChainUpdated(chainId, name, gatewayAddress);
    }

    function deactivateChain(uint32 chainId) external onlyOwner {
        require(chainIds.contains(chainId), "Chain not supported");
        supportedChains[chainId].isActive = false;
        emit ChainDeactivated(chainId);
    }

    // Token Management
    function addToken(
        string memory symbol,
        string memory name,
        uint8 decimals
    ) external onlyOwner {
        require(bytes(symbol).length > 0, "Invalid symbol");
        require(bytes(name).length > 0, "Invalid name");
        require(!tokenRegistry[symbol].isSupported, "Token already exists");

        TokenInfo storage token = tokenRegistry[symbol];
        token.symbol = symbol;
        token.name = name;
        token.decimals = decimals;
        token.isSupported = true;
        token.addedAt = block.timestamp;

        tokenSymbols.push(symbol);
        emit TokenAdded(symbol, name, decimals);
    }

    function addTokenContract(
        string memory symbol,
        uint32 chainId,
        address contractAddress,
        uint32 originChainId,
        string memory originSymbol,
        bool isDeployed
    ) external onlyOwner {
        require(tokenRegistry[symbol].isSupported, "Token not supported");
        require(chainIds.contains(chainId), "Chain not supported");
        require(contractAddress != address(0), "Invalid contract address");

        tokenRegistry[symbol].contractAddresses[chainId] = TokenDetail({
            tokenAddress: contractAddress,
            name: tokenRegistry[symbol].name,
            symbol: symbol,
            decimals: tokenRegistry[symbol].decimals,
            originChainId: originChainId,
            originSymbol: originSymbol,
            isDeployed: isDeployed
        });
        emit TokenContractAdded(symbol, chainId, contractAddress);
    }

    function deactivateToken(string memory symbol) external onlyOwner {
        require(tokenRegistry[symbol].isSupported, "Token not supported");
        tokenRegistry[symbol].isSupported = false;
        emit TokenDeactivated(symbol);
    }

    // Event Logging
    function logBridgeEvent(
        bytes32 eventId,
        uint32 sourceChainId,
        uint32 destinationChainId,
        address sourceAddress,
        address destinationAddress,
        string memory tokenSymbol,
        uint256 amount,
        bytes32 txHash,
        uint8 eventType,
        bytes memory payload
    ) external {
        require(chainIds.contains(sourceChainId), "Source chain not supported");
        require(chainIds.contains(destinationChainId), "Destination chain not supported");
        require(!eventIds.contains(eventId), "Event already logged");

        bridgeEvents[eventId] = BridgeEvent({
            eventId: eventId,
            sourceChainId: sourceChainId,
            destinationChainId: destinationChainId,
            sourceAddress: sourceAddress,
            destinationAddress: destinationAddress,
            tokenSymbol: tokenSymbol,
            amount: amount,
            txHash: txHash,
            eventType: eventType,
            timestamp: block.timestamp,
            payload: payload
        });

        eventIds.add(eventId);
        emit BridgeEventLogged(eventId, sourceChainId, destinationChainId, tokenSymbol, amount);
    }

    // View Functions
    function getSupportedChains() external view returns (ChainInfo[] memory chains) {
        uint256 length = chainIds.length();
        chains = new ChainInfo[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint32 chainId = uint32(chainIds.at(i));
            chains[i] = supportedChains[chainId];
        }
    }

    function getSupportedTokens() external view returns (
        string[] memory symbols,
        string[] memory names,
        uint8[] memory decimals
    ) {
        uint256 length = tokenSymbols.length;
        symbols = new string[](length);
        names = new string[](length);
        decimals = new uint8[](length);

        for (uint256 i = 0; i < length; i++) {
            string memory symbol = tokenSymbols[i];
            TokenInfo storage token = tokenRegistry[symbol];
            if (token.isSupported) {
                symbols[i] = token.symbol;
                names[i] = token.name;
                decimals[i] = token.decimals;
            }
        }
    }

    function getTokenContract(string memory symbol, uint32 chainId) external view returns (address) {
        require(tokenRegistry[symbol].isSupported, "Token not supported");
        return tokenRegistry[symbol].contractAddresses[chainId].tokenAddress;
    }

    function isChainSupported(uint32 chainId) external view returns (bool) {
        return chainIds.contains(chainId) && supportedChains[chainId].isActive;
    }

    function isTokenSupported(string memory symbol) external view returns (bool) {
        return tokenRegistry[symbol].isSupported;
    }

    function getChainInfo(uint32 chainId) external view returns (ChainInfo memory) {
        require(chainIds.contains(chainId), "Chain not supported");
        return supportedChains[chainId];
    }

    function getBridgeEvent(bytes32 eventId) external view returns (BridgeEvent memory) {
        require(eventIds.contains(eventId), "Event not found");
        return bridgeEvents[eventId];
    }

    function getBridgeEventsCount() external view returns (uint256) {
        return eventIds.length();
    }

    function getRecentBridgeEvents(uint256 limit) external view returns (BridgeEvent[] memory events) {
        uint256 totalEvents = eventIds.length();
        uint256 returnCount = limit > totalEvents ? totalEvents : limit;
        
        events = new BridgeEvent[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            bytes32 eventId = eventIds.at(totalEvents - 1 - i);
            events[i] = bridgeEvents[eventId];
        }
    }

    function getDetailedChainsInfo() external view returns (DetailedChainInfo[] memory) {
        uint256 chainCount = chainIds.length();
        DetailedChainInfo[] memory detailedChains = new DetailedChainInfo[](chainCount);
        
        for (uint256 i = 0; i < chainCount; i++) {
            uint32 chainId = uint32(chainIds.at(i));
            ChainInfo memory chainInfo = supportedChains[chainId];
            
            // Count tokens for this chain
            uint256 tokenCount = 0;
            for (uint256 j = 0; j < tokenSymbols.length; j++) {
                string memory symbol = tokenSymbols[j];
                if (tokenRegistry[symbol].isSupported && 
                    tokenRegistry[symbol].contractAddresses[chainId].tokenAddress != address(0)) {
                    tokenCount++;
                }
            }
            
            // Build token array
            TokenDetail[] memory tokens = new TokenDetail[](tokenCount);
            uint256 tokenIndex = 0;
            for (uint256 j = 0; j < tokenSymbols.length; j++) {
                string memory symbol = tokenSymbols[j];
                TokenInfo storage token = tokenRegistry[symbol];
                TokenDetail storage tokenDetail = token.contractAddresses[chainId];
                
                if (token.isSupported && tokenDetail.tokenAddress != address(0)) {
                    tokens[tokenIndex] = tokenDetail;
                    tokenIndex++;
                }
            }
            
            detailedChains[i] = DetailedChainInfo({
                chainInfo: chainInfo,
                tokens: tokens
            });
        }
        
        return detailedChains;
    }
}