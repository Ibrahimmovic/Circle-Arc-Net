# Vercel deployment — circle-arc-net.vercel.app

## Fix for 404 errors

The Next.js app runs from the **repository root** (not `agora-forge/`).  
`vercel.json` must **not** include legacy `routes` or a wrong `outputDirectory`.

## Vercel project settings

1. **Root Directory:** leave empty (repo root) or set to `.`
2. **Framework:** Next.js (auto)
3. **Environment variables** (Production + Preview):

| Name | Required |
|------|----------|
| `CIRCLE_API_KEY` | Yes |
| `NEXT_PUBLIC_CIRCLE_KIT_KEY` | Yes |
| `ZERION_API_KEY` | Yes |
| `GOLDRUSH_API_KEY` | Yes |
| `NEXT_PUBLIC_APP_URL` | `https://circle-arc-net.vercel.app` |
| `NEXT_PUBLIC_DEMO_WALLET` | Optional |

4. **Deployments → Redeploy** after saving env vars.

## Verify

- https://circle-arc-net.vercel.app/ — dashboard loads
- https://circle-arc-net.vercel.app/api/health — JSON with `"kitKeyPresent": true`
