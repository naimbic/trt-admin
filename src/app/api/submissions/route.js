import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { corsHeaders, corsResponse } from '@/lib/cors'

const VALID_FORMS = [
    'audit-seo', 'audit-ads', 'audit-web', 'audit-social',
    'audit-aeo', 'audit-analytics', 'audit-gratuit',
    'contact', 'newsletter', 'lead', 'candidature',
]

// In-memory rate limit: 1 per 30s per IP
const rateLimitMap = new Map()

export async function OPTIONS(request) {
    return corsResponse(request)
}

// POST /api/submissions — receive form submission (public, CORS)
export async function POST(request) {
    const headers = corsHeaders(request)
    try {
        // Rate limit
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const now = Date.now()
        const last = rateLimitMap.get(ip)
        if (last && now - last < 30000) {
            return NextResponse.json(
                { data: null, error: 'Rate limited. Try again in 30s.' },
                { status: 429, headers }
            )
        }
        rateLimitMap.set(ip, now)

        const body = await request.json()
        const formType = body.form || body.formType
        const name = body.name
        const email = body.email

        if (!name || !email) {
            return NextResponse.json(
                { data: null, error: 'name and email are required' },
                { status: 400, headers }
            )
        }
        if (!formType || !VALID_FORMS.includes(formType)) {
            return NextResponse.json(
                { data: null, error: `formType must be one of: ${VALID_FORMS.join(', ')}` },
                { status: 400, headers }
            )
        }

        const submission = await prisma.submission.create({
            data: {
                form: formType,
                name,
                email,
                phone: body.phone || null,
                company: body.company || null,
                website: body.website || null,
                needs: body.needs || null,
                budget: body.budget || null,
                deadline: body.deadline || null,
                message: body.message || null,
            },
        })

        return NextResponse.json(
            { data: { success: true, id: submission.id }, error: null },
            { headers }
        )
    } catch (error) {
        console.error('POST /api/submissions error:', error)
        return NextResponse.json(
            { data: null, error: 'Internal server error' },
            { status: 500, headers }
        )
    }
}

// GET /api/submissions — list all (admin auth required)
export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const readFilter = searchParams.get('read')

        const where = {}
        if (readFilter === 'false') where.read = false
        if (readFilter === 'true') where.read = true

        const submissions = await prisma.submission.findMany({
            where,
            orderBy: { date: 'desc' },
        })

        return NextResponse.json({ data: submissions, error: null })
    } catch (error) {
        console.error('GET /api/submissions error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}
