import { ethers } from 'hardhat'
import { config } from '../deployment-config.js'

async function checkDIGateway() {
  console.log('🔍 Comprehensive DIGateway Check\n')

  const [deployer] = await ethers.getSigners()
  const chainId = await deployer.provider.getNetwork().then(n => n.chainId)
  
  const gatewayAddress = config.addresses[chainId]?.DIGateway
  if (!gatewayAddress) {
    console.log('❌ DIGateway address not found')
    return
  }

  const gateway = await ethers.getContractAt('DIGateway', gatewayAddress)
  
  console.log('📋 Contract Information:')
  console.log(`Address: ${gatewayAddress}`)
  console.log(`Owner: ${await gateway.owner()}`)
  console.log(`Bridge Fee: ${await gateway.getBridgeFee()} BPS`)
  console.log(`Fee Receiver: ${await gateway.feeReceiver()}`)
  console.log(`Token Registry: ${await gateway.getBridgeTokenRegistry()}`)
  
  console.log('\n👥 Authorized Relayers:')
  const relayers = await gateway.getAllRelayers()
  if (relayers.length === 0) {
    console.log('  No relayers configured')
  } else {
    relayers.forEach((relayer, i) => {
      console.log(`  ${i + 1}. ${relayer}`)
    })
  }
  
  console.log('\n🔢 Command Types:')
  console.log(`SEND_TOKEN: ${await gateway.COMMAND_SEND_TOKEN()}`)
  console.log(`APPROVE_CONTRACT_CALL: ${await gateway.COMMAND_APPROVE_CONTRACT_CALL()}`)
  console.log(`APPROVE_CONTRACT_CALL_WITH_MINT: ${await gateway.COMMAND_APPROVE_CONTRACT_CALL_WITH_MINT()}`)
  
  console.log('\n📨 Message Types:')
  console.log(`TOKEN_TRANSFER: ${await gateway.MESSAGE_TYPE_TOKEN_TRANSFER()}`)
  console.log(`CONTRACT_CALL: ${await gateway.MESSAGE_TYPE_CONTRACT_CALL()}`)
  console.log(`CONTRACT_CALL_WITH_TOKEN: ${await gateway.MESSAGE_TYPE_CONTRACT_CALL_WITH_TOKEN()}`)
  
  console.log('\n🧪 Function Tests:')
  
  // Test isCommandExecuted
  const testId = ethers.keccak256(ethers.toUtf8Bytes('test'))
  console.log(`Command ${testId.slice(0, 10)}... executed: ${await gateway.isCommandExecuted(testId)}`)
  
  // Test getBridgeTransaction
  try {
    const txInfo = await gateway.getBridgeTransaction(testId)
    console.log(`Bridge transaction exists: ${txInfo.sourceChainId > 0}`)
  } catch {
    console.log('Bridge transaction: Not found (expected)')
  }
  
  console.log('\n✅ DIGateway check completed')
}

checkDIGateway()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error.message)
    process.exit(1)
  })