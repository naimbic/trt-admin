import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const project = searchParams.get('project')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where = project && project.length > 0 ? { project } : {}

        const [entries, total] = await Promise.all([
            prisma.changelog.findMany({
                where,
                orderBy: [{ date: 'desc' }, { id: 'desc' }],
                skip,
                take: limit,
            }),
            prisma.changelog.count({ where }),
        ])

        return NextResponse.json({ data: entries, total, error: null })
    } catch (error) {
        console.error('GET /api/changelog error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/changelog — create a new changelog entry (auth required)
export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const entry = await prisma.changelog.create({
            data: {
                version: body.version || null,
                message: body.message,
                type: body.type || 'update',
                project: body.project || 'backend',
                files: body.files || [],
                author: body.author || session.user.name || null,
                commitHash: body.commitHash || null,
                date: body.date ? new Date(body.date) : new Date(),
            },
        })

        return NextResponse.json({ data: entry, error: null })
    } catch (error) {
        console.error('POST /api/changelog error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
