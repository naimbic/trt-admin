import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { corsHeaders, corsResponse } from '@/lib/cors'

// In-memory rate limit: 1 per 5s per IP
const rateLimitMap = new Map()
// Dedup: skip same path within 60s
const dedupMap = new Map()

export async function OPTIONS(request) {
    return corsResponse(request)
}

// POST /api/404-log — log 404 errors (public, CORS)
export async function POST(request) {
    const headers = corsHeaders(request)
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const now = Date.now()

        // Rate limit
        const last = rateLimitMap.get(ip)
        if (last && now - last < 5000) {
            return NextResponse.json(
                { data: null, error: 'Rate limited. Try again in 5s.' },
                { status: 429, headers }
            )
        }
        rateLimitMap.set(ip, now)

        const body = await request.json()
        const path = body.path
        if (!path) {
            return NextResponse.json(
                { data: null, error: 'path is required' },
                { status: 400, headers }
            )
        }

        // Dedup: skip if same path logged within 60s
        const dedupKey = path
        const lastLogged = dedupMap.get(dedupKey)
        if (lastLogged && now - lastLogged < 60000) {
            return NextResponse.json(
                { data: { success: true, deduplicated: true }, error: null },
                { headers }
            )
        }
        dedupMap.set(dedupKey, now)

        await prisma.errorLog.create({
            data: {
                url: path,
                referrer: body.referrer || null,
                ua: body.ua || null,
            },
        })

        return NextResponse.json(
            { data: { success: true }, error: null },
            { headers }
        )
    } catch (error) {
        console.error('POST /api/404-log error:', error)
        return NextResponse.json(
            { data: null, error: 'Internal server error' },
            { status: 500, headers }
        )
    }
}
