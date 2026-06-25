# Aramco Properties Dashboard
## Jake — Deployment Guide

This is a production Next.js 14 dashboard for Aramco Properties. Everything is built. Your job is to configure and deploy.

---

## Step 1 — Install Dependencies

```bash
npm install
```

---

## Step 2 — Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in these values:

### Required
```
NEXT_PUBLIC_SUPABASE_URL=        # From existing Supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # From existing Supabase project (anon key only)
NEXTAUTH_URL=                    # Your Vercel URL e.g. https://aramco-dashboard.vercel.app
NEXTAUTH_SECRET=                 # Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DASHBOARD_USERNAME=aramcoproperties
DASHBOARD_PASSWORD_HASH=         # Generate hash of Coolpass$123 (see below)
```

### Generate the password hash
```bash
node -e "const b=require('bcryptjs');b.hash('Coolpass\$123',10).then(h=>console.log(h))"
```
Copy the output (starts with `$2a$10$...`) as `DASHBOARD_PASSWORD_HASH`

### Optional
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY= # Maps page won't work without this
```

---

## Step 3 — Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000`
Login with:
- Username: `aramcoproperties`
- Password: `Coolpass$123`

---

## Step 4 — Deploy to Vercel

### Option A — Vercel CLI
```bash
npm i -g vercel
vercel
```

### Option B — Vercel Dashboard
1. Push this repo to GitHub
2. Go to vercel.com → New Project → Import repo
3. Framework: Next.js (auto-detected)
4. Add ALL environment variables from `.env.local` in Vercel's project settings
5. Deploy

---

## Step 5 — Add Supabase Anon Key to Vercel

In Vercel project settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXTAUTH_URL` (set to your actual Vercel domain)
- `NEXTAUTH_SECRET`
- `DASHBOARD_USERNAME`
- `DASHBOARD_PASSWORD_HASH`

---

## What's Built

| Page | Status |
|------|--------|
| /login | ✅ Complete |
| /dashboard | ✅ Complete — KPIs, pipeline chart, activity feed, hot leads, appointments, agent status |
| /seller-leads | ✅ Complete — filterable table with score badges |
| /pipeline | ✅ Complete — Kanban board by stage |
| /buyer-leads | ✅ Complete — tier badges, POF status |
| /appointments | ✅ Complete — upcoming/past cards |
| /tasks | ✅ Complete — grouped by agent |
| /analytics | ✅ Complete — 6 charts |
| /agent-monitor | ✅ Complete — real-time status cards |
| /notifications | ✅ Complete — approvals list |
| /contracts | ✅ Complete — document table |
| /settings | ✅ Complete |
| /maps | 🔧 Needs Google Maps API key |
| /seller-leads/[id] | 🔧 Jake to complete detail page |
| /pipeline/[id] | 🔧 Jake to complete detail page |
| /buyer-leads/[id] | 🔧 Jake to complete detail page |

---

## Detail Pages for Jake to Complete

The list and overview pages are all done. Three detail pages need to be built:

### /seller-leads/[id]
Query `seller_leads` + `properties` + `calls` + `texts` + `activities` + `notes` by id.
Display: property card, owner card, distress signals checklist, MAO calculator (3 tiers), ARV card, activity timeline.

### /pipeline/[id]
Query `pipeline` + `properties` + `seller_leads` + `buyer_leads` + `contracts` + `activities` by id.
Display: deal header, progress stepper, deadline tracker, offer details, seller/buyer cards, documents, timeline.

### /buyer-leads/[id]
Query `buyer_leads` + `pipeline_buyers` + `activities` by id.
Display: contact info, buy box, POF status, purchase history, matched deals, activity log.

---

## Architecture Notes

- Auth: NextAuth credentials provider — username/password only, no OAuth needed
- Database: Supabase anon key — read only, RLS enforced
- Real-time: Supabase subscriptions on activities and approvals tables
- State: React Query with 30s stale time
- All `'use client'` — data fetching happens client-side via React Query + Supabase JS client

---

## Login Credentials

```
Username: aramcoproperties
Password: Coolpass$123
```
