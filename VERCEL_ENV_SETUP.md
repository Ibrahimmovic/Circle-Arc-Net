# Vercel environment variables (required for live site)

Go to **Vercel → circle-arc-net → Settings → Environment Variables**.

Add these **exact variable names** and paste your keys as values (Production + Preview):

| Variable name | Your value starts with |
|---------------|------------------------|
| `CIRCLE_API_KEY` | `TEST_API_KEY:` |
| `NEXT_PUBLIC_CIRCLE_KIT_KEY` | `KIT_KEY:` |
| `CIRCLE_KIT_KEY` | `KIT_KEY:` (optional server copy for swap proxy) |
| `ZERION_API_KEY` | `zk_` |
| `GOLDRUSH_API_KEY` | `cqt_` |
| `NEXT_PUBLIC_APP_URL` | `https://circle-arc-net.vercel.app` |
| `NEXT_PUBLIC_NETWORK` | `testnet` |

Then: **Deployments → ⋯ → Redeploy**.

The header will show green **Circle · Kit · Zerion · GoldRush** when all APIs work.
