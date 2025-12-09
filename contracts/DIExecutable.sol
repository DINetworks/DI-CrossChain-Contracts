// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IDIGateway.sol";

/**
 * @title DIExecutable
 * @dev Base contract for contracts that want to receive GMP calls from DIGateway
 */
abstract contract DIExecutable {
    IDIGateway public immutable gateway;
    
    constructor(address gateway_) {
        gateway = IDIGateway(gateway_);
    }
    
    modifier onlyGateway() {
        require(msg.sender == address(gateway), "Only gateway");
        _;
    }
    
    function execute(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload
    ) external onlyGateway {
        _execute(commandId, sourceChainId, sourceAddress, payload);
    }
    
    function executeWithToken(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) external onlyGateway {
        _executeWithToken(commandId, sourceChainId, sourceAddress, payload, tokenSymbol, amount);
    }
    
    function _execute(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload
    ) internal virtual {}
    
    function _executeWithToken(
        bytes32 commandId,
        uint32 sourceChainId,
        address sourceAddress,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal virtual {}
}