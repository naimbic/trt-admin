import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// PUT /api/redirects/:id — update a redirect (admin auth required)
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const data = {}
        if (body.from !== undefined) data.from = body.from
        if (body.to !== undefined) data.to = body.to
        if (body.type !== undefined) data.type = body.type === 302 ? 302 : 301
        if (body.active !== undefined) data.active = body.active
        if (body.note !== undefined) data.note = body.note

        const redirect = await prisma.redirect.update({
            where: { id },
            data,
        })

        return NextResponse.json({ data: redirect, error: null })
    } catch (error) {
        console.error('PUT /api/redirects/[id] error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/redirects/:id — delete a redirect (admin auth required)
export async function DELETE(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Unlink from error logs
        await prisma.errorLog.updateMany({
            where: { redirectId: id },
            data: { redirectId: null },
        }).catch(() => {})

        await prisma.redirect.delete({ where: { id } })

        return NextResponse.json({ data: { success: true }, error: null })
    } catch (error) {
        console.error('DELETE /api/redirects/[id] error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}
