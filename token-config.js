// Token configuration for bridge deployment by network
module.exports = {
  crossfi: [
    {
      name: "XUSD",
      symbol: "XUSD",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XUSD",
      address: "0x7D55FBbdBc11D3EeaC4a33867c5c79517Be3C703",
      logoURI: "",
      priceFeed: "0x41F6dd3bf7a1e50e95D42fC74D840137dB4a891e",
      priceKey: "XUSD/USD",
      useDIAOracle: true
    },
    {
      name: "XFI",
      symbol: "XFI",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XFI",
      address: "0x0000000000000000000000000000000000000000",
      logoURI: "",
      priceFeed: "0x41F6dd3bf7a1e50e95D42fC74D840137dB4a891e",
      priceKey: "XFI/USD",
      useDIAOracle: true
    },
    {
      name: "DI Bridged USDT",
      symbol: "USDT",
      decimals: 6,
      originChainId: 1,
      originSymbol: "USDT",
      logoURI: "",
      priceFeed: "0x41F6dd3bf7a1e50e95D42fC74D840137dB4a891e",
      priceKey: "",
      useDIAOracle: true
    },
    {
      name: "DI Bridged USDC",
      symbol: "USDC",
      decimals: 6,
      originChainId: 1,
      originSymbol: "USDC",
      logoURI: "",
      priceFeed: "0x41F6dd3bf7a1e50e95D42fC74D840137dB4a891e",
      priceKey: "",
      useDIAOracle: true
    }
  ],
  mainnet: [
    {
      name: "DI Bridged XUSD",
      symbol: "XUSD",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XUSD",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "DI Bridged XFI",
      symbol: "XFI",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XFI",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "Tether USD",
      symbol: "USDT",
      decimals: 6,
      originChainId: 1,
      originSymbol: "USDT",
      address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      originChainId: 1,
      originSymbol: "USDC",
      address: "0xA0b86a33E6441b8435b662f98137B0b665CbC8c1",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    }
  ],
  bsc: [
    {
      name: "DI Bridged XUSD",
      symbol: "XUSD",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XUSD",
      address: "0x0000000000000000000000000000000000000000",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "DI Bridged XFI",
      symbol: "XFI",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XFI",
      address: "0x0000000000000000000000000000000000000000",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "Tether USDT",
      symbol: "USDT",
      decimals: 18,
      originChainId: 56,
      originSymbol: "USDT",
      address: "0x55d398326f99059fF775485246999027B3197955",
      logoURI: "",
      priceFeed: "0xB97Ad0E74fa7d920791E90258A6E2085088b4320",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "USD Coin",
      symbol: "USDC",
      decimals: 18,
      originChainId: 56,
      originSymbol: "USDC",
      address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32CD580d",
      logoURI: "",
      priceFeed: "0x51597f405303C4377E36123cBc172b13269EA163",
      priceKey: "",
      useDIAOracle: false
    }
  ],
  polygon: [
    {
      name: "Bridged XUSD",
      symbol: "XUSD",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XUSD",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "Bridged XFI",
      symbol: "XFI",
      decimals: 18,
      originChainId: 4157,
      originSymbol: "XFI",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "Native USDT",
      symbol: "USDT",
      decimals: 6,
      originChainId: 137,
      originSymbol: "USDT",
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    },
    {
      name: "Native USDC",
      symbol: "USDC",
      decimals: 6,
      originChainId: 137,
      originSymbol: "USDC",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      logoURI: "",
      priceFeed: "0x0000000000000000000000000000000000000000",
      priceKey: "",
      useDIAOracle: false
    }
  ]
};