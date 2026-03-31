#!/usr/bin/env node
// Test script for all GenRebalancer contract methods
// Run with: node test-contract.mjs

import { createClient, createAccount, chains } from "genlayer-js";

const CONTRACT = "0x9EDF9D4ECD234d766a508B10618864B538422FE0";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const client = createClient({ chain: chains.testnetBradbury });

function log(label, value) {
  console.log(`\n✅ ${label}:`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

function err(label, e) {
  console.log(`\n❌ ${label} FAILED: ${e.message}`);
}

async function testReads() {
  console.log("═══════════════════════════════════════");
  console.log("  📖 TESTING READ (VIEW) METHODS");
  console.log("═══════════════════════════════════════");

  // 1. get_constitution
  try {
    const result = await client.readContract({
      address: CONTRACT,
      functionName: "get_constitution",
      args: [],
    });
    log("get_constitution", JSON.parse(result));
  } catch (e) { err("get_constitution", e); }

  // 2. get_audit_logs
  try {
    const result = await client.readContract({
      address: CONTRACT,
      functionName: "get_audit_logs",
      args: [],
    });
    const logs = JSON.parse(result);
    log(`get_audit_logs (${logs.length} entries found)`, logs.slice(-2)); // show last 2
  } catch (e) { err("get_audit_logs", e); }
}

async function testWrites() {
  if (!PRIVATE_KEY) {
    console.log("\n⚠️  Skipping write tests — set PRIVATE_KEY env var to test writes.");
    return;
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  ✍️  TESTING WRITE METHODS");
  console.log("═══════════════════════════════════════");

  const account = createAccount(
    PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : `0x${PRIVATE_KEY}`
  );
  console.log(`\nSigning as: ${account.address}`);

  // 3. update_constitution — owner-protected non-AI write
  try {
    console.log("\n⏳ [3/5] update_constitution(75, 20, 150)...");
    const hash = await client.writeContract({
      address: CONTRACT,
      account,
      functionName: "update_constitution",
      args: [75, 20, 150],
      value: BigInt(0),
    });
    log("update_constitution ✅ hash", hash);
  } catch (e) { err("update_constitution", e); }

  // 4. set_treasury — owner-protected, sets the treasury wallet
  try {
    const demoTreasury = account.address; // use self as treasury for demo
    console.log(`\n⏳ [4/5] set_treasury(${demoTreasury})...`);
    const hash = await client.writeContract({
      address: CONTRACT,
      account,
      functionName: "set_treasury",
      args: [demoTreasury],
      value: BigInt(0),
    });
    log("set_treasury ✅ hash", hash);

    // Verify treasury & constitution updated
    const result = await client.readContract({
      address: CONTRACT,
      functionName: "get_constitution",
      args: [],
    });
    log("get_constitution after updates", JSON.parse(result));
  } catch (e) { err("set_treasury", e); }

  // 5. heartbeat — AI consensus write
  try {
    console.log("\n⏳ [5/5] heartbeat() — triggers AI consensus across validators...");
    console.log("   (may take 15-30 seconds, testnet validators must agree)");
    const hash = await client.writeContract({
      address: CONTRACT,
      account,
      functionName: "heartbeat",
      args: [
        "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=daily",
        "https://api.alternative.me/fng/",
        "https://www.coindesk.com/arc/outboundfeeds/rss/"
      ],
      value: BigInt(0),
    });
    log("heartbeat ✅ hash", hash);

    // Read audit logs to confirm entry was written
    const logs = await client.readContract({
      address: CONTRACT,
      functionName: "get_audit_logs",
      args: [],
    });
    const parsed = JSON.parse(logs);
    log(`audit_logs after heartbeat (${parsed.length} total entries)`, parsed.slice(-1));
  } catch (e) { err("heartbeat", e); }
}

async function main() {
  console.log("🧪 GenRebalancer Contract Test Suite");
  console.log(`Contract: ${CONTRACT}`);
  console.log(`Network:  Bradbury Testnet`);

  await testReads();
  await testWrites();

  console.log("\n═══════════════════════════════════════");
  console.log("  ✅ Test suite complete!");
  console.log("═══════════════════════════════════════\n");
}

main().catch(console.error);
