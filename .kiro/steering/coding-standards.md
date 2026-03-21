---
inclusion: auto
---

# Coding Standards & Rules

## Server Actions
- ALL server actions MUST use `import prisma from '@/lib/prisma'`
- NEVER import from `@/mock/data/` or `src/mock/`
- Always use `'use server'` directive at top
- Return data shapes that match what frontend components expect
- Handle errors with try/catch, never let raw Prisma errors reach the client

## API Routes
- Use consistent response format: `NextResponse.json({ data, error, meta })`
- Always wrap in try/catch
- Validate input with Zod before DB operations
- Use proper HTTP status codes (200, 201, 400, 404, 500)
- For list endpoints, support: pageIndex, pageSize, sortKey, order, query

## Prisma
- Use the singleton from `@/lib/prisma` — never create new PrismaClient()
- Model names and fields must match `prisma/schema.prisma` exactly
- After schema changes, run `npx prisma generate` (auto-hook handles this)
- Use `include` for relations, `select` for partial fields
- Convert dates to timestamps (seconds) when returning to frontend

## Frontend Integration API (/api/v1/*)
- All external routes must validate Bearer JWT token
- Enable CORS for FRONTEND_URL
- Version all external endpoints under /api/v1/
- Internal dashboard routes stay under /api/ (no version prefix)

## File Naming
- Server actions: `src/server/actions/getEntityName.js` (camelCase)
- API routes: `src/app/api/entity-name/route.js` (kebab-case)
- Components: PascalCase
- Hooks: `use` prefix (useAuth, useTheme)

## i18n
- All user-facing strings must use next-intl `useTranslations()`
- Arabic (ar) and French (fr) are priority languages
- RTL must be tested for all new components
