# Agora Forge

**Adaptive portfolio manager + cross-chain USDC execution** — built for the [Agora Agent Hackathon](https://forms.gle/ok3Gr9zhmHnApvK48) (Canteen × Circle × Arc).

> *Markets are the agora; AI agents are the new citizens.*

## What it does

| Track | Implementation |
|-------|----------------|
| **RFB 04 — Adaptive Portfolio** | Regime detection (risk-on / neutral / risk-off), chain drift vs targets, rebalance action queue |
| **RFB 05 — Cross-market execution** | Circle **App Kit** + **CCTP** USDC bridges via `@circle-fin/app-kit` |
| **Circle stack** | Programmable **Wallets API** (server), **Kit Key** (bridge/swap), Arc settlement narrative |
| **Data layer** | **Zerion** portfolio/positions + **GoldRush** multichain balances |

## Stack

- **Next.js 16** · React 19 · Tailwind 4
- **Circle**: `@circle-fin/app-kit`, `@circle-fin/adapter-viem-v2`, Wallets REST API
- **Wagmi** wallet connect for live CCTP execution
- **Zerion API** + **GoldRush (Covalent)** APIs

## Quick start

```bash
cd agora-forge
cp .env.example .env.local
# Add your Circle TEST_API_KEY, KIT_KEY, Zerion, GoldRush keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `CIRCLE_API_KEY` | Server-side Circle Wallets (`TEST_API_KEY:...`) |
| `NEXT_PUBLIC_CIRCLE_KIT_KEY` | App Kit / Swap Kit (`KIT_KEY:...`) |
| `ZERION_API_KEY` | Portfolio & positions |
| `GOLDRUSH_API_KEY` | Multichain balances |
| `NEXT_PUBLIC_DEMO_WALLET` | Default address when wallet disconnected |

**Never commit `.env.local` or real API keys.**

## Pages

- `/` — Command center dashboard
- `/portfolio` — Adaptive allocation, regime targets, rebalance queue
- `/execute` — Cross-chain CCTP bridge (Circle App Kit)
- `/agent` — Agent console & cycle telemetry

## Live demo (Vercel)

**https://circle-arc-net.vercel.app/**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for env vars and Vercel project setup.

## Hackathon submission checklist

1. **GitHub**: this repo (public)
2. **Live URL**: https://circle-arc-net.vercel.app/
3. **Video**: 3 min demo — regime shift → rebalance queue → CCTP estimate/execute
4. **Form**: https://forms.gle/ok3Gr9zhmHnApvK48

## Circle products used

- [App Kit](https://docs.arc.network/app-kit) — `bridge()`, `estimateBridge()`, CCTP v2
- [Programmable Wallets API](https://developers.circle.com/) — `/v1/w3s/wallets`
- Arc — USDC-native fees, sub-second finality (positioning for agent HFT)

## License

MIT — hackathon submission.
