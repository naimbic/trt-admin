import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/submissions/:id — mark as read (admin auth required)
export async function PATCH(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const submission = await prisma.submission.update({
            where: { id },
            data: { read: body.read === true },
        })

        return NextResponse.json({ data: submission, error: null })
    } catch (error) {
        console.error('PATCH /api/submissions/[id] error:', error)
        return NextResponse.json({ data: null, error: 'Internal server error' }, { status: 500 })
    }
}
