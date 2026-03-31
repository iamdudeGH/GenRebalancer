// Debug: inspect what the CLI sends vs what we'd send manually
import { createClient, http } from 'genlayer-js';

// Replicate what the CLI does internally
// 1. parseScalar('10') -> Number(10) since isSafeInteger
// 2. makeCalldataObject('update_constitution', [10, 25, 200], undefined) -> {method: 'update_constitution', args: [10, 25, 200]}
// 3. encode4(calldataObject) -> bytes
// 4. serialize([encodedCalldata, false]) -> bytes

// Let's just directly use the SDK
const client = createClient({
  endpoint: 'https://studio.genlayer.com/api'
});

console.log('Testing calldata encoding...');

// We know the CLI builds: { method: "update_constitution", args: [10, 25, 200] }
// Then encodes this as GenLayer calldata and wraps in addTransaction
// The "Transaction reverted" means the EVM-level tx reverted

// Let's check if the issue is that integers are being sent as BigInt by the parseScalar
// parseScalar('10') -> checks Number.isSafeInteger(10) -> true -> returns Number(10)
// So the args should be [10, 25, 200] as regular JS numbers

// The GenLayer calldata encoder uses TYPE_PINT for positive integers
// Let's verify: Number(10) vs BigInt(10) treatment in the encoder

console.log('typeof Number(10):', typeof Number(10));  // 'number'
console.log('typeof BigInt(10):', typeof BigInt(10));   // 'bigint'

// The calldata encoder likely handles both, but let's check if there's a 
// difference in how the GenVM deserializes them.

// Actually, the more likely issue: the CLI's `--args 10 25 200` 
// may be creating args as BigInt after all, OR the EVM revert is 
// happening because of an insufficient gas estimate or invalid function encoding.

console.log('\nThe parseScalar for "10":');
function parseScalar(value) {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  // ... address/bytes checks omitted
  const HEX_RE = /^0x[0-9a-fA-F]+$/;
  if (HEX_RE.test(value)) return BigInt(value);
  if (!isNaN(Number(value)) && Number.isSafeInteger(Number(value))) return Number(value);
  if (!isNaN(Number(value))) return BigInt(value);
  return value;
}

console.log('parseScalar("10"):', parseScalar("10"), typeof parseScalar("10"));
console.log('parseScalar("25"):', parseScalar("25"), typeof parseScalar("25"));
console.log('parseScalar("200"):', parseScalar("200"), typeof parseScalar("200"));
