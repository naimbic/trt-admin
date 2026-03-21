---
inclusion: auto
---

# Frontend Integration — trtmaroc.com ↔ CRM

## Frontend Stack (trtmaroc.com)
- Next.js Pages Router, deployed on Netlify + Cloudflare CDN
- Storage: Netlify Blobs (prod) / JSON files (dev)
- Auth: JWT in HttpOnly cookie (`trt_admin_token`), single admin user
- i18n: French (default), English, Arabic (RTL)
- Google APIs: GA4 + Search Console via service account

## Integration Strategy

The CRM (this project) becomes the single source of truth for ALL data.
The frontend replaces its Netlify Blobs storage with API calls to the CRM.

### Phase A: Shared Database (MongoDB)
- Frontend API routes swap `createFlatStore()` calls for fetch() to CRM API
- CRM exposes `/api/v1/*` endpoints matching the frontend's expected response shapes
- Both apps share the same `AUTH_SECRET` for JWT verification

### Phase B: Auth Unification
- CRM manages users (Prisma User model with roles)
- Frontend validates JWT against CRM's `/api/v1/auth/verify` endpoint
- Admin login goes through CRM auth (not env var credentials)

## API Endpoints CRM Must Expose for Frontend

### Public (no auth):
| CRM Route | Replaces Frontend Route | Purpose |
|-----------|------------------------|---------|
| `POST /api/v1/views` | `POST /api/views` | Increment page views |
| `POST /api/v1/likes` | `POST /api/likes` | Increment page likes |
| `POST /api/v1/shares` | `POST /api/shares` | Increment page shares |
| `GET /api/v1/interactions` | `GET /api/interactions` | Batch fetch stats |
| `POST /api/v1/comments` | `POST /api/comments` | Add/read comments |
| `POST /api/v1/comment-likes` | `POST /api/comment-likes` | Like comments |
| `POST /api/v1/submissions` | `POST /api/submissions` | Form submissions |
| `POST /api/v1/newsletter` | `POST /api/newsletter` | Newsletter signup |
| `POST /api/v1/leads` | `POST /api/leads` | Lead capture |
| `POST /api/v1/404-log` | `POST /api/404-log` | Log 404 errors |

### Admin (auth required):
| CRM Route | Replaces Frontend Route | Purpose |
|-----------|------------------------|---------|
| `GET /api/v1/admin/analytics` | `GET /api/admin/analytics` | Page stats |
| `GET /api/v1/admin/google` | `GET /api/admin/google` | GA4 + SC data |
| `GET /api/v1/admin/errors` | `GET /api/admin/errors` | 404 logs |
| `GET /api/v1/admin/indexing` | `GET /api/admin/indexing` | Indexing status |
| `POST /api/v1/admin/index-url` | `POST /api/admin/index-url` | Request indexing |
| `GET /api/v1/admin/notifications` | `GET /api/admin/notifications` | Admin alerts |
| `GET /api/v1/admin/stats` | `GET /api/admin/stats` | Full dashboard |
| `GET /api/v1/admin/export` | `GET /api/admin/export` | Data backup |

## Response Shape Compatibility

ALL `/api/v1/*` responses MUST match the exact JSON shapes documented in the
frontend architecture report (Section 18). The frontend admin panel expects
these specific structures — any deviation will break the UI.

## Submission Form Types (11 types)
contact, audit-gratuit, audit-seo, audit-ads, audit-web, audit-social,
audit-aeo, audit-analytics, newsletter, candidature, lead

## Environment Variables to Share
- `AUTH_SECRET` — same value in both apps for JWT verification
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — same service account
- `GOOGLE_PRIVATE_KEY` — same key
- `GA4_PROPERTY_ID` — same GA4 property
- `SEARCH_CONSOLE_SITE_URL` — same SC site
- `SMTP_*` — email config (CRM handles sending)
