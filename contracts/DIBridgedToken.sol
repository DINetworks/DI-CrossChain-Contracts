// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DIBridgedToken
 * @dev Template for bridged tokens that can be minted/burned by DIGateway
 */
contract DIBridgedToken is ERC20, Ownable {
    address public tokenRegistry;
    uint32 public originChainId;
    string public originSymbol;
    
    constructor() ERC20("", "") Ownable() {}
    
    function initialize(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint32 originChainId_,
        string memory originSymbol_,
        address tokenRegistry_,
        address owner_
    ) external {
        require(bytes(_name).length == 0, "Already initialized");
        
        _name = name;
        _symbol = symbol;
        _decimals = decimals_;
        originChainId = originChainId_;
        originSymbol = originSymbol_;
        tokenRegistry = tokenRegistry_;
        _transferOwnership(owner_);
    }
    
    modifier onlyTokenRegistry() {
        require(msg.sender == tokenRegistry, "Only token registry");
        _;
    }
    
    function mint(address to, uint256 amount) external onlyTokenRegistry {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyTokenRegistry {
        _burn(from, amount);
    }
    
    function decimals() public view override returns (uint8) {
        return _decimals;
    }
    
    // Storage for name, symbol, decimals
    string private _name;
    string private _symbol;
    uint8 private _decimals;
}