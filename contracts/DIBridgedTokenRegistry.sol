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
        bool isDeployed;
    }
    
    mapping(string => TokenInfo) public supportedTokens;
    string[] public tokenList;
    
    event TokenDeployed(
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
        require(supportedTokens[symbol].tokenAddress != address(0), "Token not supported");
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
        address tokenAddress,
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint32 originChainId,
        string memory originSymbol,
        bool deployNewToken,
        bool forceDeploy
    ) external onlyOwner returns (address) {
        
        if (forceDeploy) {
            removeToken(symbol);
        }
        require(supportedTokens[symbol].tokenAddress == address(0), "Token already exists");

        address newTokenAddress = tokenAddress;
        
        if (deployNewToken) {
            newTokenAddress = template.clone();
            DIBridgedToken(newTokenAddress).initialize(
                name,
                symbol,
                decimals,
                originChainId,
                originSymbol,
                gateway,
                owner()
            );

            emit TokenDeployed(newTokenAddress, name, symbol, originChainId, originSymbol);
        }

        supportedTokens[symbol] = TokenInfo({
            tokenAddress: newTokenAddress,
            name: name,
            symbol: symbol,
            decimals: decimals,
            originChainId: originChainId,
            originSymbol: originSymbol,
            isDeployed: deployNewToken
        });
        tokenList.push(symbol);

        emit TokenAdded(symbol);

        return newTokenAddress;
    }

    function removeToken(
        string memory symbol
    ) internal {
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
        require(supportedTokens[symbol].tokenAddress != address(0), "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        DIBridgedToken(token).mint(to, amount);
    }

    function burnToken(string memory symbol, address from, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].tokenAddress != address(0), "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        DIBridgedToken(token).burn(from, amount);
    }

    function lockToken(string memory symbol, address from, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].tokenAddress != address(0), "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        IERC20(token).safeTransferFrom(from, address(this), amount);
    }

    function unlockToken(string memory symbol, address to, uint256 amount) external onlyGateway {
        require(supportedTokens[symbol].tokenAddress != address(0), "Token not supported");
        address token = supportedTokens[symbol].tokenAddress;
        IERC20(token).safeTransfer(to, amount);
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
        return supportedTokens[symbol].tokenAddress != address(0);
    }

    function getTokenAddress(string memory symbol) external view returns (address) {
        return supportedTokens[symbol].tokenAddress;
    }

    function getTokenBySymbol(string memory symbol) external view returns (TokenInfo memory) {
        return supportedTokens[symbol];
    }

    function isTokenDeployed(string memory symbol) external view returns (bool) {
        require(supportedTokens[symbol].tokenAddress != address(0), "Token not supported");
        return supportedTokens[symbol].isDeployed;
    }
    
    function setGateway(address newGateway) external onlyOwner {
        require(newGateway != address(0), "Invalid gateway");
        gateway = newGateway;
        emit GatewayUpdated(gateway, newGateway);
    }
}