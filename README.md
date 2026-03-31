# GenRebalancer 🧠⚖️

> **AI-Consensus DAO Treasury Risk Manager** — The first DAO treasury manager where no single AI decides. Decentralized validators must agree.

[![Contract](https://img.shields.io/badge/Contract-Bradbury%20Testnet-7c3aed)](https://studio.genlayer.com/contracts/0x9EDF9D4ECD234d766a508B10618864B538422FE0)
[![Built with GenLayer](https://img.shields.io/badge/Built%20with-GenLayer-00d4ff)](https://genlayer.com)
[![Next.js](https://img.shields.io/badge/Dashboard-Next.js%2016-black)](https://nextjs.org)

---

## 🎯 The Problem

DAOs collectively manage billions in treasury assets. Yet most rely on a **single person, a centralized bot, or a simple price alert** to decide when to rebalance. This is a catastrophic single point of failure:

- One compromised AI oracle → drained treasury
- One bad actor with multisig access → rugged DAO
- One wrong signal → unnecessary liquidation

## 💡 The Solution

**GenRebalancer** uses GenLayer's **Equivalence Principle** (Optimistic Democracy) to replace centralized risk oracles with **decentralized AI consensus**:

1. Multiple independent AI validators each fetch live market data
2. Each validator independently runs the risk analysis
3. The result is only accepted when validators **unanimously agree** on the risk verdict
4. Every decision is permanently written on-chain as an immutable audit log

No single AI. No single point of failure. Just transparent, decentralized risk governance.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧠 **AI Consensus Risk Engine** | Multiple validators independently assess Fear & Greed Index data — must agree before logging |
| 📜 **On-chain Constitution** | DAO-governed risk parameters (`risk_tolerance`, `speed_limit`, `protection_slippage`) |
| 🔒 **Owner Access Control** | Only the deployer (DAO governor) can update constitution or set treasury |
| 📋 **Immutable Audit Log** | Every AI decision permanently stored in `DynArray` state |
| 🏛 **Treasury Integration Ready** | `treasury_address` field points to Gnosis Safe for real execution |
| ⚡ **Live Dashboard** | Next.js frontend with auto-retry consensus handling via `genlayer-js` SDK |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GenRebalancer.py                   │
│                                                      │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │ Constitution │    │       heartbeat()          │ │
│  │              │    │                            │ │
│  │ risk_tol: 70%│    │  ┌──────────────────────┐ │ │
│  │ speed_lim: 25│    │  │  run_analysis()       │ │ │
│  │ slippage: 2% │    │  │  → fetch F&G Index    │ │ │
│  │ owner: addr  │    │  │  → LLM risk scoring   │ │ │
│  │ treasury: addr    │  │  → return JSON        │ │ │
│  └──────────────┘    │  └──────────────────────┘ │ │
│                      │            ↓               │ │
│  ┌──────────────┐    │  prompt_non_comparative()  │ │
│  │  audit_logs  │ ←──│  [v1 agree] [v2 agree]    │ │
│  │  DynArray    │    │  [v3 agree] → CONSENSUS    │ │
│  └──────────────┘    └────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                           ↕ genlayer-js SDK
┌─────────────────────────────────────────────────────┐
│              Next.js Dashboard                       │
│  • Reads audit_logs via readContract()               │
│  • Triggers heartbeat via /api/heartbeat route       │
│  • Auto-retries on validator disagreement            │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Contract Methods

| Method | Type | Access | Description |
|---|---|---|---|
| `get_constitution()` | view | public | Returns risk params, owner & treasury address |
| `get_audit_logs()` | view | public | Returns full AI decision history |
| `heartbeat()` | write (AI) | public | Triggers multi-validator AI consensus on live market data |
| `update_constitution(pct, limit, slippage)` | write | owner only | Update DAO risk thresholds |
| `set_treasury(address)` | write | owner only | Point to Gnosis Safe treasury address |

---

## 🚀 Quick Start

### Prerequisites
- [GenLayer CLI](https://docs.genlayer.com) installed
- Node.js 18+
- A Bradbury testnet account with test tokens ([faucet](https://studio.genlayer.com))

### 1. Deploy the Contract

```bash
cd /path/to/GenRebalance
genlayer deploy --contract contracts/GenRebalancer.py
# Note the contract address from the output
```

### 2. Run the Dashboard

```bash
cd dashboard

# Add your private key
echo "PRIVATE_KEY=0x<your_private_key>" > .env.local

# Install dependencies & run
npm install
npm run dev
```

Open **http://localhost:3000** — the dashboard connects to the live Bradbury testnet contract.

### 3. Trigger a Heartbeat

Click **"Run Live Heartbeat"** in the dashboard UI, or run directly:

```bash
genlayer write <CONTRACT_ADDRESS> heartbeat
```

---

## 🧪 Testing Contract Methods

```bash
cd dashboard
PRIVATE_KEY=0x<your_key> node test-contract.mjs
```

This runs all 5 methods and shows results:
- ✅ `get_constitution` — reads current risk params
- ✅ `get_audit_logs` — reads AI decision history
- ✅ `update_constitution` — updates risk thresholds (owner only)
- ✅ `set_treasury` — sets treasury wallet (owner only)
- ✅ `heartbeat` — triggers live AI consensus

---

## 🌐 Live Deployment

| | |
|---|---|
| **Network** | Bradbury Testnet |
| **Contract** | [`0x9EDF9D4ECD234d766a508B10618864B538422FE0`](https://studio.genlayer.com/contracts/0x9EDF9D4ECD234d766a508B10618864B538422FE0) |
| **Explorer** | https://studio.genlayer.com/contracts/0x9EDF9D4ECD234d766a508B10618864B538422FE0 |

---

## 🛠 Tech Stack

- **Smart Contract** — GenLayer Intelligent Contract (Python)
- **AI Consensus** — `gl.eq_principle.prompt_non_comparative` (Optimistic Democracy)
- **Web Data** — `gl.nondet.web.render` (Fear & Greed Index)
- **Frontend** — Next.js 16 (App Router, Turbopack)
- **Blockchain SDK** — `genlayer-js` v0.23.0
- **Network** — Bradbury Testnet

---

## 🗺 Roadmap

- [ ] **Gnosis Safe integration** — auto-propose multisig transactions on `TRADE_AUTHORIZED`
- [ ] **Multi-asset support** — expand beyond ETH to full portfolio rebalancing
- [ ] **DAO governance** — on-chain voting for constitution changes via token-weighted proposals
- [ ] **Alert webhooks** — Telegram/Discord notifications on critical market signals
- [ ] **Historical analytics** — dashboard graphs of risk scores over time

---

## 🏆 Bradbury Builders Hackathon

Built for the [GenLayer Bradbury Builders Hackathon](https://dorahacks.io/hackathon/genlayer-bradbury).

> *"The same reason DAOs use multisigs instead of single keys — GenRebalancer brings that philosophy to AI-driven treasury management."*

---

## 📄 License

MIT
