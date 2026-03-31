import { NextResponse } from 'next/server';
import { createClient, createAccount, chains } from 'genlayer-js';

const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { contract } = await req.json();

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "No PRIVATE_KEY environment variable provided to the server." }, { status: 400 });
    }

    const client = createClient({
      chain: chains.testnetBradbury
    });

    const account = createAccount(
      privateKey.startsWith('0x') ? privateKey as `0x${string}` : `0x${privateKey}`
    );

    console.log(`Executing heartbeat via API as: ${account.address}`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Heartbeat attempt ${attempt}/${MAX_RETRIES}...`);
        const hash = await client.writeContract({
          address: contract as `0x${string}`,
          account,
          functionName: "heartbeat",
          args: [
            "https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=1&interval=daily",
            "https://api.alternative.me/fng/",
            "https://www.coindesk.com/arc/outboundfeeds/rss/"
          ],
          value: BigInt(0),
        });
        console.log(`Heartbeat succeeded on attempt ${attempt}. Hash: ${hash}`);
        return NextResponse.json({ success: true, hash, attempt });
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        const isRevert = msg.toLowerCase().includes('revert') || msg.toLowerCase().includes('disagree');
        if (isRevert && attempt < MAX_RETRIES) {
          console.log(`Attempt ${attempt} reverted (validator disagreement), retrying in ${RETRY_DELAY_MS}ms...`);
          await sleep(RETRY_DELAY_MS);
        } else {
          break;
        }
      }
    }

    throw lastError;
  } catch (error: any) {
    console.error("Heartbeat API Error (all retries exhausted):", error);
    return NextResponse.json({ error: error.message || "Execution failed after retries" }, { status: 500 });
  }
}
