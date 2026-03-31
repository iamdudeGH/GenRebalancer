# GenRebalancer — Hackathon Submission Guide
> Submit here: https://dorahacks.io/hackathon/genlayer-bradbury/buidl

---

## ✅ Pre-Submission Checklist

- [ ] Final contract deployed to Bradbury testnet
- [ ] Update CONTRACT address in `dashboard/app/page.tsx` line 5
- [ ] Start dashboard with `cd dashboard && npm run dev`
- [ ] Run at least 1 heartbeat BEFORE demo so audit logs are populated
- [ ] Push code to GitHub

---

## 📋 Submission Fields

### Project Name
```
GenRebalancer — AI-Consensus DAO Treasury Risk Manager
```

### Tagline
```
The first DAO treasury manager where no single AI decides — decentralized validators must agree.
```

### Description (copy-paste this)
```
GenRebalancer is an Intelligent Contract on GenLayer that brings decentralized AI consensus 
to DAO treasury risk management. Instead of trusting a single AI oracle to make financial 
decisions, GenRebalancer deploys GenLayer's Equivalence Principle — making multiple 
independent AI validators evaluate live market fear & greed data and only authorizing a 
rebalance trade when they reach consensus.

Key Features:
🧠 AI Consensus Risk Engine — Multiple validators independently assess Fear & Greed Index 
   data and must agree before flagging a risk event
📜 On-chain Constitution — DAO-governed risk parameters (risk_tolerance, speed_limit, 
   protection_slippage) protected by owner access control
📋 Immutable Audit Log — Every AI decision is permanently written to the contract's 
   DynArray state for full transparency  
🏛 Treasury Integration Ready — treasury_address field points to a Gnosis Safe to receive 
   rebalance signals when TRADE_AUTHORIZED fires
⚡ Live on Bradbury Testnet — Fully deployed and interactable via dashboard

How GenLayer makes this possible:
Without GenLayer's Optimistic Democracy consensus, you'd need to trust a single centralized 
AI to manage billions in DAO treasury funds — a catastrophic single point of failure. 
GenRebalancer uses prompt_non_comparative to enforce that multiple independent AI validators 
must independently reach the same risk conclusion before any action is logged on-chain.
```

### Tech Stack
```
- GenLayer Intelligent Contracts (Python)
- GenLayer-JS SDK (v0.23.0)
- Next.js 16 (Dashboard)
- Bradbury Testnet
```

### Contract Address
```
0x9EDF9D4ECD234d766a508B10618864B538422FE0
```

### Explorer Link
```
https://studio.genlayer.com/contracts/0x9EDF9D4ECD234d766a508B10618864B538422FE0
```

---

## 🚀 Contract Methods Summary (for judges)

| Method | Type | Description |
|--------|------|-------------|
| `get_constitution()` | view | Returns current risk parameters + owner + treasury |
| `get_audit_logs()` | view | Returns full array of AI decisions |
| `heartbeat()` | write (AI) | Triggers multi-validator AI consensus on live market data |
| `update_constitution(pct, limit, slippage)` | write | Owner-only: update risk thresholds |
| `set_treasury(address)` | write | Owner-only: point to Gnosis Safe treasury |

---

## 🎯 Anticipated Judge Questions & Answers

**Q: What happens after TRADE_AUTHORIZED?**
> In production, the heartbeat result is read by a Gnosis Safe guard contract that automatically 
> proposes a rebalance transaction to the DAO multisig. The `treasury_address` field stores 
> that Safe address.

**Q: Why not just use a single AI oracle like Chainlink?**
> A single AI can be manipulated, hallucinate, or fail. GenLayer's Equivalence Principle 
> requires N independent validators to agree — the same reason you use a multisig instead 
> of a single key.

**Q: Is the AI decision deterministic?**
> No — and that's the point! The Fear & Greed Index value changes constantly. 
> GenLayer's consensus ensures that even with non-deterministic AI outputs, the validators 
> must agree on the final risk verdict before it's written on-chain.

---

## 🔑 Environment Setup (for judges running locally)

```bash
# 1. Deploy contract
cd /Users/monu/Desktop/GenRebalance
genlayer deploy --contract contracts/GenRebalancer.py

# 2. Add private key to dashboard
echo "PRIVATE_KEY=<your_key>" > dashboard/.env.local

# 3. Run dashboard
cd dashboard
npm run dev
# Open http://localhost:3000
```
