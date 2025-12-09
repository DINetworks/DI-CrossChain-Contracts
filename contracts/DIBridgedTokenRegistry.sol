// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "./DIBridgedToken.sol";

/**
 * @title DIBridgedTokenRegistry
 * @dev Factory for deploying DIBridgedToken instances via cloning
 */
contract DIBridgedTokenRegistry is Ownable {
    using Clones for address;
    
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
    }
    
    mapping(bytes32 => TokenInfo) public tokens;
    mapping(address => bytes32) public tokenToId;
    bytes32[] public tokenIds;
    
    event TokenDeployed(
        bytes32 indexed tokenId,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint32 originChainId,
        string originSymbol
    );
    
    event GatewayUpdated(address indexed oldGateway, address indexed newGateway);
    
    constructor(address template_, address gateway_, address owner_) Ownable() {
        template = template_;
        gateway = gateway_;
        _transferOwnership(owner_);
    }
    
    modifier onlyGateway() {
        require(msg.sender == gateway, "Only gateway");
        _;
    }
    
    function deploy(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint32 originChainId,
        string memory originSymbol
    ) external onlyGateway returns (address) {
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
            exists: true
        });
        
        tokenToId[clone] = tokenId;
        tokenIds.push(tokenId);
        
        emit TokenDeployed(tokenId, clone, name, symbol, originChainId, originSymbol);
        return clone;
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
    
    function setGateway(address newGateway) external onlyOwner {
        require(newGateway != address(0), "Invalid gateway");
        emit GatewayUpdated(gateway, newGateway);
        gateway = newGateway;
    }
}