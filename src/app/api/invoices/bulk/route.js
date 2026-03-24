import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { action, ids } = await request.json()
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
        }

        if (action === 'delete') {
            await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } })
            await prisma.invoice.deleteMany({ where: { id: { in: ids } } })
            return NextResponse.json({ success: true, deleted: ids.length })
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    } catch (error) {
        console.error('POST /api/invoices/bulk error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
