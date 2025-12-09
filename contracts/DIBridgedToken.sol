// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DIBridgedToken
 * @dev Template for bridged tokens that can be minted/burned by DIGateway
 */
contract DIBridgedToken is ERC20, Ownable {
    address public gateway;
    uint32 public originChainId;
    string public originSymbol;
    bool public constant isBridgedToken = true;
    
    event GatewayUpdated(address indexed oldGateway, address indexed newGateway);
    
    constructor() ERC20("", "") Ownable() {}
    
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint32 originChainId_,
        string memory originSymbol_,
        address gateway_,
        address owner_
    ) external {
        require(bytes(_name).length == 0, "Already initialized");
        
        _name = name;
        _symbol = symbol;
        _decimals = decimals_;
        originChainId = originChainId_;
        originSymbol = originSymbol_;
        gateway = gateway_;
        _transferOwnership(owner_);
    }
    
    modifier onlyGateway() {
        require(msg.sender == gateway, "Only gateway");
        _;
    }
    
    function mint(address to, uint256 amount) external onlyGateway {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyGateway {
        _burn(from, amount);
    }
    
    function setGateway(address newGateway) external onlyOwner {
        require(newGateway != address(0), "Invalid gateway");
        emit GatewayUpdated(gateway, newGateway);
        gateway = newGateway;
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    // Storage for name, symbol, decimals
    string private _name;
    string private _symbol;
    uint8 private _decimals;
}