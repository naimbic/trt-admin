import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                notifDesktop: true,
                notifUnreadBadge: true,
                notifEmail: true,
                notifAbout: true,
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            desktop: user.notifDesktop,
            unreadMessageBadge: user.notifUnreadBadge,
            email: user.notifEmail,
            notifymeAbout: user.notifAbout || 'mentionsOnly',
        })
    } catch (error) {
        console.error('GET /api/setting/notification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                notifDesktop: body.desktop,
                notifUnreadBadge: body.unreadMessageBadge,
                notifEmail: body.email,
                notifAbout: body.notifymeAbout,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PUT /api/setting/notification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}