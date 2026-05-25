# Deploy to Vercel

**Production URL:** https://circle-arc-net.vercel.app/

## Option A — Root Directory `agora-forge` (recommended)

1. Import repo in [Vercel](https://vercel.com/new).
2. Set **Root Directory** to `agora-forge`.
3. Framework: **Next.js** (auto-detected).
4. Add environment variables (see below).
5. Deploy.

Uses `agora-forge/vercel.json`.

## Option B — Repository root

If Root Directory is the repo root, Vercel uses `/vercel.json` which runs install/build inside `agora-forge/`.

## Required environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

| Name | Notes |
|------|--------|
| `CIRCLE_API_KEY` | `TEST_API_KEY:...` (server only) |
| `NEXT_PUBLIC_CIRCLE_KIT_KEY` | `KIT_KEY:...` |
| `ZERION_API_KEY` | `zk_...` |
| `GOLDRUSH_API_KEY` | `cqt_...` |
| `NEXT_PUBLIC_APP_URL` | `https://circle-arc-net.vercel.app` |
| `NEXT_PUBLIC_DEMO_WALLET` | Optional demo address |

## Custom domain

The default Vercel hostname is **circle-arc-net.vercel.app**. To add a custom domain:

1. Vercel → Project → **Domains**
2. Add your domain and follow DNS instructions

## Hackathon submission link

Use **https://circle-arc-net.vercel.app/** as your live demo URL on the submission form.
