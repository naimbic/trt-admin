import { NextResponse } from 'next/server'
import { unstable_noStore as noStore } from 'next/cache'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/errors — list 404 logs sorted by hitCount desc (admin auth required)
export async function GET() {
    noStore()
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
        }

        const errors = await prisma.errorLog.findMany({
            orderBy: { hitCount: 'desc' },
            take: 500,
        })

        return NextResponse.json({ data: errors, error: null })
    } catch (error) {
        console.error('GET /api/admin/errors error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}
