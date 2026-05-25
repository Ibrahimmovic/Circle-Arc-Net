# Agora Forge — Circle Arc Net

**Live demo:** https://circle-arc-net.vercel.app/

Adaptive portfolio manager + cross-chain USDC execution for the **Agora Agent Hackathon** (Canteen × Circle × Arc).

## Quick start

```bash
cp .env.example .env.local   # add API keys
npm install
npm run dev
```

Open http://localhost:3000

## Vercel deploy

This repo is configured for Vercel at the **repository root** (`vercel.json` + Next.js).

### Required environment variables (Vercel dashboard)

| Variable | Description |
|----------|-------------|
| `CIRCLE_API_KEY` | `TEST_API_KEY:...` |
| `NEXT_PUBLIC_CIRCLE_KIT_KEY` | `KIT_KEY:...` |
| `ZERION_API_KEY` | `zk_...` |
| `GOLDRUSH_API_KEY` | `cqt_...` |
| `NEXT_PUBLIC_APP_URL` | `https://circle-arc-net.vercel.app` |

After adding env vars, **Redeploy** from the Vercel dashboard.

## Pages

- `/` — Command center
- `/portfolio` — Adaptive portfolio & rebalance queue
- `/execute` — Circle CCTP bridge (App Kit)
- `/agent` — Agent console

## Submit hackathon

- Form: https://forms.gle/ok3Gr9zhmHnApvK48
- Live URL: https://circle-arc-net.vercel.app/
