import { createClient } from 'genlayer-js';

const CONTRACT = '0xd52eA20A84F2f84CA34F8382Dbf6fa312DE98b57';

const client = createClient({
  chain: 'bradbury',
  account: { address: process.env.GENLAYER_ACCOUNT }
});

// Try writing with explicit integer args
try {
  const hash = await client.writeContract({
    address: CONTRACT,
    functionName: 'update_constitution',
    args: [10, 25, 200],
    value: 0n
  });
  console.log('TX Hash:', hash);
  
  const result = await client.waitForTransactionReceipt({
    hash,
    retries: 100,
    interval: 5000
  });
  console.log('Result:', JSON.stringify(result, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
} catch (e) {
  console.error('Error:', e.message);
}
