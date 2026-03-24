import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/notifications/count — get unread notification count
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ count: 0 })
        }

        const count = await prisma.notification.count({
            where: { userId: session.user.id, read: false },
        })

        return NextResponse.json({ count })
    } catch (error) {
        console.error('GET /api/notifications/count error:', error)
        return NextResponse.json({ count: 0 })
    }
}
