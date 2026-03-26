import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { corsHeaders, corsResponse } from '@/lib/cors'

export async function OPTIONS(request) {
    return corsResponse(request)
}

// GET /api/redirects/check?path=/old-page — check if a redirect exists for a path (public, CORS)
export async function GET(request) {
    const headers = corsHeaders(request)
    try {
        const { searchParams } = new URL(request.url)
        const path = searchParams.get('path')

        if (!path) {
            return NextResponse.json({ data: null, error: 'path is required' }, { status: 400, headers })
        }

        const redirect = await prisma.redirect.findUnique({
            where: { from: path },
        })

        if (!redirect || !redirect.active) {
            return NextResponse.json({ data: null, error: null }, { headers })
        }

        // Increment hits
        await prisma.redirect.update({
            where: { id: redirect.id },
            data: { hits: { increment: 1 } },
        }).catch(() => {})

        return NextResponse.json({
            data: { to: redirect.to, type: redirect.type },
            error: null,
        }, { headers })
    } catch (error) {
        console.error('GET /api/redirects/check error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500, headers })
    }
}
