// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DIExecutable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title GMPExample
 * @dev Example contract demonstrating GMP usage with DIGateway
 */
contract GMPExample is DIExecutable {
    mapping(bytes32 => string) public receivedMessages;
    mapping(bytes32 => uint256) public receivedAmounts;
    
    event MessageReceived(bytes32 indexed commandId, string sourceChain, string sourceAddress, string message);
    event TokenReceived(bytes32 indexed commandId, string sourceChain, string sourceAddress, string symbol, uint256 amount);
    
    constructor(address gateway_) DIExecutable(gateway_) {}
    
    // Send a simple message to another chain
    function sendMessage(
        string memory destinationChain,
        string memory destinationContract,
        string memory message
    ) external {
        bytes memory payload = abi.encode(message);
        gateway.callContract(destinationChain, destinationContract, payload);
    }
    
    // Send message with tokens
    function sendMessageWithToken(
        string memory destinationChain,
        string memory destinationContract,
        string memory message,
        string memory tokenSymbol,
        uint256 amount
    ) external {
        bytes memory payload = abi.encode(message);
        gateway.callContractWithToken(destinationChain, destinationContract, payload, tokenSymbol, amount);
    }
    
    // Receive message from another chain
    function _execute(
        bytes32 commandId,
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload
    ) internal override {
        string memory message = abi.decode(payload, (string));
        receivedMessages[commandId] = message;
        emit MessageReceived(commandId, sourceChain, sourceAddress, message);
    }
    
    // Receive message with tokens from another chain
    function _executeWithToken(
        bytes32 commandId,
        string memory sourceChain,
        string memory sourceAddress,
        bytes calldata payload,
        string memory tokenSymbol,
        uint256 amount
    ) internal override {
        string memory message = abi.decode(payload, (string));
        receivedMessages[commandId] = message;
        receivedAmounts[commandId] = amount;
        emit TokenReceived(commandId, sourceChain, sourceAddress, tokenSymbol, amount);
    }
}