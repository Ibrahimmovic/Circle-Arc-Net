# Vercel environment variables (required for live site)

Go to **Vercel → circle-arc-net → Settings → Environment Variables**.

Add these **exact variable names** and paste your keys as values (Production + Preview):

| Variable name | Your value starts with |
|---------------|------------------------|
| `CIRCLE_API_KEY` | `LIVE_API_KEY:` (mainnet) or `TEST_API_KEY:` (testnet only) |
| `NEXT_PUBLIC_CIRCLE_KIT_KEY` | `KIT_KEY:` |
| `CIRCLE_KIT_KEY` | `KIT_KEY:` (optional server copy for swap proxy) |
| `ZERION_API_KEY` | `zk_` |
| `GOLDRUSH_API_KEY` | `cqt_` |
| `NEXT_PUBLIC_APP_URL` | `https://circle-arc-net.vercel.app` |
| `NEXT_PUBLIC_NETWORK` | `mainnet` (use `testnet` only for Arc demo deploys; edit existing row — no duplicate) |
| `NEXT_PUBLIC_DEMO_WALLET` | optional `0x…` for status checks |

`vercel.json` already sets `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_NETWORK` for Production — secrets (`ZERION_API_KEY`, `GOLDRUSH_API_KEY`, `CIRCLE_API_KEY`) must be added in the Vercel UI only.

Then: **Deployments → ⋯ → Redeploy**.

The header will show green **Circle · Kit · Zerion · GoldRush** when all APIs work. Portfolio **PnL charts** use Zerion `/wallets/{address}/charts/{period}` (same `ZERION_API_KEY`).
