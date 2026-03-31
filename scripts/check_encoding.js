const { createClient, http, getContract } = require('genlayer');

const CONTRACT_ADDRESS = "0x8104Bf9FE6B0C4c2C9DbB087878AF06aBc4fB0DF";
const RPC_URL = "https://zksync-os-testnet-genlayer.zksync.dev";

async function main() {
    // We don't even need a wallet to encode function data
    // But we need the ABI or at least the method name.
    // GenLayer JS SDK uses a proxy for contract methods.
    console.log("Encoding call for get_audit_logs...");
    
    // Let's see how the SDK does it.
    // Since GenLayer uses a specialized client, let's just inspect the request it would send.
    const client = createClient({
        chain: { rpcUrls: { default: { http: [RPC_URL] } } },
        transport: http()
    });

    // In GenLayerJS, contract calls are typically done via a contract instance.
    // However, we just want to see the calldata without a full ABI if possible.
    // Or we provide a minimal ABI.
    const abi = [{
        name: 'get_audit_logs',
        type: 'function',
        stateMutability: 'view',
        inputs: [],
        outputs: [{ type: 'string[]' }]
    }];

    const contract = getContract({
        address: CONTRACT_ADDRESS,
        abi: abi,
        client: client
    });

    // We can't easily intercept the encoded data without a custom transport, 
    // but we can try to call it and catch the error if it reveals the data.
    try {
        await contract.read.get_audit_logs();
    } catch (e) {
        // e.request might contain the data if it's a viem-style error
        console.log("Request data:", e.request?.params?.[0]?.data);
        console.log("Error message:", e.message);
    }
}

main();
