import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/admin/errors — list 404 logs (admin auth required)
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
        }

        const errors = await prisma.errorLog.findMany({
            orderBy: { date: 'desc' },
            take: 500,
        })

        return NextResponse.json({ data: errors, error: null })
    } catch (error) {
        console.error('GET /api/admin/errors error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}
