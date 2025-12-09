// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IDIAOracle {
    function getValue(string memory) external view returns (uint128 price, uint128);
    function getPrice(address token) external view returns (uint256 price);
}
