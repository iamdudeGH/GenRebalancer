import { createClient, http } from 'genlayer';

// Contract address we just deployed on Bradbury
const CONTRACT_ADDRESS = '0xd52eA20A84F2f84CA34F8382Dbf6fa312DE98b57';
// Use the Bradbury RPC
const RPC_URL = 'https://studio.genlayer.com/api';

async function main() {
  // Check if we have a private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ Please provide a PRIVATE_KEY environment variable.");
    console.error("Example: PRIVATE_KEY=0xYourPrivateKey node test_heartbeat.mjs");
    process.exit(1);
  }

  // Set up the GenLayer client
  console.log("🔄 Initializing GenLayer client...");
  const client = createClient({
    chain: { rpcUrls: { default: { http: [RPC_URL] } } },
    transport: http()
  });

  // We need an account instance to sign the transaction.
  // We can create one from the private key in viem/genlayer style
  // Let's use standard viem account creation.
  const { privateKeyToAccount } = await import('viem/accounts');
  const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
  console.log(`✅ Using account: ${account.address}`);

  console.log(`\n⏳ Sending 'heartbeat' write transaction to ${CONTRACT_ADDRESS}...`);
  try {
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      account,
      method: "heartbeat",
      args: [],           // No arguments required for heartbeat
      value: 0n,          // No value to send
    });

    console.log(`✅ Transaction submitted! Hash: ${hash}`);
    
    // Optional: wait for receipt or consensus result 
    // depending on the version of the genlayer SDK.
    console.log("\nTransaction accepted by L1. Wait a moment and check the block explorer for consensus processing.");
    console.log(`Explorer URL: https://explorer.genlayer.com/transactions/${hash}`);

  } catch (err) {
    console.error("\n❌ Error during transaction execution:");
    console.error(err);
  }
}

main();
