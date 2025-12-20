// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./DIBridgedToken.sol";

/**
 * @title DIBridgedTokenRegistry
 * @dev Factory for deploying DIBridgedToken instances and managing token operations
 */
contract DIBridgedTokenRegistry is Ownable {
    using Clones for address;
    using SafeERC20 for IERC20;
    
    address public immutable template;
    address public gateway;
    
    struct TokenInfo {
        address tokenAddress;
        string name;
        string symbol;
        uint8 decimals;
        uint32 originChainId;
        string originSymbol;
        bool exists;
        bool isBridged;
    }
    
    mapping(bytes32 => TokenInfo) public tokens;
    mapping(address => bytes32) public tokenToId;
    mapping(string => TokenInfo) public supportedTokens;
    bytes32[] public tokenIds;
    string[] public tokenList;
    
    event TokenDeployed(
        bytes32 indexed tokenId,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint32 originChainId,
        string originSymbol
    );

    modifier onlyGateway() {
        require(msg.sender == gateway, "Only gateway");
        _;
    }
    
    modifier supportedToken(string memory symbol) {
        require(supportedTokens[symbol].exists, "Token not supported");
        _;
    }
    
    event TokenAdded(string indexed symbol);
    event TokenRemoved(string indexed symbol);
    event GatewayUpdated(address indexed oldGateway, address indexed newGateway);
    
    constructor(address owner_, address template_) Ownable() {
        template = template_;
        _transferOwnership(owner_);
    }
    
    function deploy(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint32 originChainId,
        string memory originSymbol
    ) external onlyOwner returns (address) {
        bytes32 tokenId = keccak256(abi.encodePacked(originChainId, originSymbol));
        require(!tokens[tokenId].exists, "Token already exists");
        
        address clone = template.clone();
        DIBridgedToken(clone).initialize(
            name,
            symbol,
            decimals_,
            originChainId,
            originSymbol,
            gateway,
            owner()
        );
        
        tokens[tokenId] = TokenInfo({
            tokenAddress: clone,
            name: name,
            symbol: symbol,
            decimals: decimals_,
            originChainId: originChainId,
            originSymbol: originSymbol,
            exists: true,
            isBridged: true
        });
        
        tokenToId[clone] = tokenId;
        tokenIds.push(tokenId);
        
        // Add to supported tokens
        supportedTokens[symbol] = TokenInfo({
            tokenAddress: clone,
            name: name,
            symbol: symbol,
            decimals: decimals_,
            originChainId: originChainId,
            originSymbol: originSymbol,
            exists: true,
            isBridged: true
        });
        tokenList.push(symbol);
        
        emit TokenDeployed(tokenId, clone, name, symbol, originChainId, originSymbol);
        emit TokenAdded(symbol);
        return clone;
    }
    
    function addToken(
        string memory symbol,
        address contractAddress,
        string memory name,
        uint8 decimals,
        bool isBridged
    ) external onlyOwner {
        require(!supportedTokens[symbol].exists, "Token already supported");
        supportedTokens[symbol] = TokenInfo({
            tokenAddress: contractAddress,
            name: name,
            symbol: symbol,
            decimals: decimals,
            originChainId: 0,
            originSymbol: "",
            exists: true,
            isBridged: isBridged
        });
        tokenList.push(symbol);
        emit TokenAdded(symbol);
    }

    function removeToken(
        string memory symbol
    ) external supportedToken(symbol) onlyOwner {
        supportedTokens[symbol].exists = false;
        supportedTokens[symbol].tokenAddress = address(0);

        for (uint256 i = 0; i < tokenList.length; i++) {
            if (keccak256(bytes(tokenList[i])) == keccak256(bytes(symbol))) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }

        emit TokenRemoved(symbol);
    }

    // Token operations for gateway
    function mintToken(string memory symbol, address to, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].exists, "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        DIBridgedToken(token).mint(to, amount);
    }

    function burnToken(string memory symbol, address from, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].exists, "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        DIBridgedToken(token).burn(from, amount);
    }

    function lockToken(string memory symbol, address from, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].exists, "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        IERC20(token).safeTransferFrom(from, address(this), amount);
    }

    function unlockToken(string memory symbol, address to, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].exists, "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        IERC20(token).safeTransfer(to, amount);
    }
    
    function getToken(uint32 originChainId, string memory originSymbol) external view returns (address) {
        bytes32 tokenId = keccak256(abi.encodePacked(originChainId, originSymbol));
        return tokens[tokenId].tokenAddress;
    }
    
    function getTokenInfo(bytes32 tokenId) external view returns (TokenInfo memory) {
        return tokens[tokenId];
    }
    
    function getAllTokens() external view returns (bytes32[] memory) {
        return tokenIds;
    }

    function getSupportedTokens() external view returns (TokenInfo[] memory tokenInfos) {
        tokenInfos = new TokenInfo[](tokenList.length);
        for (uint256 i = 0; i < tokenList.length; i++) {
            string memory symbol = tokenList[i];
            tokenInfos[i] = supportedTokens[symbol];
        }
        return tokenInfos;
    }

    function isTokenSupported(string memory symbol) external view returns (bool) {
        return supportedTokens[symbol].exists;
    }

    function getTokenAddress(string memory symbol) external view returns (address) {
        return supportedTokens[symbol].tokenAddress;
    }

    function getTokenBySymbol(string memory symbol) external view returns (TokenInfo memory) {
        return supportedTokens[symbol];
    }

    function isTokenBridged(string memory symbol) external view returns (bool) {
        require(supportedTokens[symbol].exists, "Token not supported");
        return supportedTokens[symbol].isBridged;
    }
    
    function setGateway(address newGateway) external onlyOwner {
        require(newGateway != address(0), "Invalid gateway");
        gateway = newGateway;
        emit GatewayUpdated(gateway, newGateway);
    }
}