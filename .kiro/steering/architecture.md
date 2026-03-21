---
inclusion: auto
---

# TRT Maroc CRM — Architecture & Integration Guide

## System Overview

This project is the **admin/dashboard/CRM backend** for TRT Maroc (trtmaroc.com).
It connects to a separate Next.js frontend (the public website) via a shared REST API and shared MongoDB database.

## Architecture

```
┌─────────────────────┐     REST API (CORS)     ┌──────────────────────┐
│  trtmaroc.com        │ ◄──────────────────────► │  admin.trtmaroc.com  │
│  (Public Frontend)   │                          │  (This Project)      │
│  Next.js             │                          │  Next.js + Prisma    │
└─────────────────────┘                          └──────────────────────┘
         │                                                 │
         └──────────────── MongoDB Atlas ──────────────────┘
                        (Shared Database)
```

## Key Decisions

1. **Shared MongoDB** — Both apps connect to the same MongoDB Atlas cluster. The CRM owns the schema (Prisma). The frontend reads via API routes exposed by this project.
2. **REST API** — This project exposes `/api/*` routes that the frontend consumes. Auth tokens (JWT) are shared via a common secret.
3. **No GraphQL** — REST is simpler for this scale. If needed later, we can add a GraphQL layer.
4. **Server Actions** — Internal dashboard pages use Next.js server actions (direct Prisma). External frontend uses REST API routes.

## API Design for Frontend Integration

All external API routes should:
- Live under `/api/v1/*` (versioned)
- Accept Bearer token auth (JWT from shared NextAuth secret)
- Return consistent JSON: `{ data, error, meta: { total, page, pageSize } }`
- Support CORS for the frontend domain

## Database Ownership

- This project (CRM) owns the Prisma schema
- Frontend should NEVER write directly to MongoDB
- All writes go through CRM API routes
- Frontend can read via API or (if co-deployed) shared Prisma client

## Environment Variables Required

```env
DATABASE_URL=mongodb+srv://...
AUTH_SECRET=shared-between-both-apps
GITHUB_AUTH_CLIENT_ID=
GITHUB_AUTH_CLIENT_SECRET=
GOOGLE_AUTH_CLIENT_ID=
GOOGLE_AUTH_CLIENT_SECRET=
NEXT_PUBLIC_API_URL=https://admin.trtmaroc.com/api
FRONTEND_URL=https://trtmaroc.com
```
