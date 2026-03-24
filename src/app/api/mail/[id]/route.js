import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// PUT /api/mail/[id] — update mail (star, flag, group, label)
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const data = {}
        if (typeof body.starred === 'boolean') data.starred = body.starred
        if (typeof body.flagged === 'boolean') data.flagged = body.flagged
        if (body.group !== undefined) data.group = body.group
        if (body.label !== undefined) data.label = body.label

        const updated = await prisma.mailThread.update({
            where: { id },
            data,
        })

        return NextResponse.json({ id: updated.id, ...data })
    } catch (error) {
        console.error('PUT /api/mail/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/mail/[id] — delete mail thread
export async function DELETE(_, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        await prisma.mailThread.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/mail/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
