--------------------------------------- How to Deploy --------------------------------
1. npx hardhat run scripts/deploy-bridge.js --network crossfiTestnet

    Deployer: 0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
    DIBridgedToken Template: 0x5BA032E43c70c8271510B9E0A0C077a3a2cd5351
    DIBridgedTokenRegistry: 0xB75b34766f2D0c3C471FA614fe104A12A3873E37
    DIGateway: 0x19aC2B530F55E25c8e8E142B1Dfc1a81E7DE36a1
    Bridge Fee: 30 bps
    Fee Receiver: 0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
    TokenFactory gateway updated
    BridgeMonitor: 0xA636298F0f86aeb43f503F6F97a292b4f2fA2452
    Relayer added
    GMPExample: 0xE1710B362CD9C28431Bd7947a49A7640C1d40690
    === Bridge Infrastructure Deployed ===
    DIBridgedToken Template: 0x5BA032E43c70c8271510B9E0A0C077a3a2cd5351
    DIBridgedTokenRegistry: 0xB75b34766f2D0c3C471FA614fe104A12A3873E37 
    DIGateway: 0x19aC2B530F55E25c8e8E142B1Dfc1a81E7DE36a1
    BridgeMonitor: 0xA636298F0f86aeb43f503F6F97a292b4f2fA2452
    GMPExample: 0xE1710B362CD9C28431Bd7947a49A7640C1d40690
2. Replace with correct DIGateway, DIBridgedTokenRegistry address in scripts/deploy-bridge-tokens.js.
3. npx hardhat run scripts/deploy-bridge-tokens.js --network crossfiTestnet

    Deployer: 0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
    Network: crossfiTestnet

    === Processing Bridge Tokens for crossfiTestnet ===
    Adding existing token XUSD (XUSD): 0x7D55FBbdBc11D3EeaC4a33867c5c79517Be3C703
    Adding existing token WXFI (WXFI): 0x398D6abeF2D415C9E1545E8CFe94a5da71750fcd
    Deploying new token DI Bridged USDT (USDT)...
    Deployed DI Bridged USDT (USDT): 0x02a404a9572Ff5180f8f80880e6ae06a9Ecb0bC1
    Deploying new token DI Bridged USDC (USDC)...
    Deployed DI Bridged USDC (USDC): 0x64ab5EAE14bAFBD1A0EFdb443aDf5382d1795132
    === Bridge Token Processing Complete ===

4. Replace ABI in Relayer
    replace with correct gateway address in .env, set correct chains in rpc/chain.js


-------------------------------------------------BSC---------------------------------------------------------
Deployer: 0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
DIBridgedToken Template: 0xA446e20F6ecABa88FD53BbBD055e00bC6621401A
DIBridgedTokenRegistry: 0xA4D001ddf3791b91cB433edAe0fbaC61af4BcC6A
DIGateway: 0xE9f68Fa7FFef49e2Be71C1F011C45eD4e85b88F8
Bridge Fee: 30 bps
Fee Receiver: 0x9Ee8A60b09B526dD8264E83B1dc92a45E41868a3
TokenFactory gateway updated
BridgeMonitor: 0x74442596EaC4DB1841DECfD7d1CB75F0E41F5B1F
Relayer added
GMPExample: 0xB2b0C2c8f94A64890BDf391367FFB1d781f3d0aC

=== Bridge Infrastructure Deployed ===
DIBridgedToken Template: 0xA446e20F6ecABa88FD53BbBD055e00bC6621401A
DIBridgedTokenRegistry: 0xA4D001ddf3791b91cB433edAe0fbaC61af4BcC6A
DIGateway: 0xE9f68Fa7FFef49e2Be71C1F011C45eD4e85b88F8
BridgeMonitor: 0x74442596EaC4DB1841DECfD7d1CB75F0E41F5B1F
GMPExample: 0xB2b0C2c8f94A64890BDf391367FFB1d781f3d0aC

=== Processing Bridge Tokens for bsc ===
Deploying new token DI Bridged XUSD (XUSD)...
Deployed DI Bridged XUSD (XUSD): 0xa6da53D83ebd06fcd2bE5C78dd62A465b311C280
Deploying new token DI Bridged XFI (XFI)...
Deployed DI Bridged XFI (XFI): 0xe65647CF36Bc55E42DB38Be60F8087023642E981
Adding existing token Tether USDT (USDT): 0x55d398326f99059fF775485246999027B3197955
Failed to process Tether USDT: execution reverted: Token already supported: 0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000017546f6b656e20616c726561647920737570706f72746564000000000000000000
Adding existing token USD Coin (USDC): 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
Failed to process USD Coin: execution reverted: Token already supported: 0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000017546f6b656e20616c726561647920737570706f72746564000000000000000000

=== Bridge Token Processing Complete ===