import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'

dayjs.extend(relativeTime)

// GET /api/notifications — get notification list for current user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'desc' },
            take: 50,
        })

        const list = notifications.map((n) => {
            // Map notification type string to UI type number
            // type 0 = avatar/person (chat), type 1 = calendar icon (mail), type 2 = clipboard icon (invoice)
            let uiType = 0
            let status = ''
            const msg = (n.message || '').toLowerCase()
            if (msg.includes('invoice') || msg.includes('payment')) {
                uiType = 2
                status = n.type === 'success' ? 'succeed' : n.type === 'error' ? 'failed' : 'succeed'
            } else if (msg.includes('mail') || msg.includes('email')) {
                uiType = 1
            }

            return {
                id: n.id,
                target: n.title,
                description: n.message,
                date: dayjs(n.date).fromNow(),
                image: '',
                type: uiType,
                status,
                readed: n.read,
                link: n.link || null,
            }
        })

        return NextResponse.json(list)
    } catch (error) {
        console.error('GET /api/notifications error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// PUT /api/notifications — mark notifications as read
export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        if (body.markAll) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, read: false },
                data: { read: true },
            })
        } else if (body.id) {
            await prisma.notification.update({
                where: { id: body.id },
                data: { read: true },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PUT /api/notifications error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
