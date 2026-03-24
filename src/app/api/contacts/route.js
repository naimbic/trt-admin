import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/contacts — list all users + customers as contacts
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [users, customers] = await Promise.all([
            prisma.user.findMany({
                where: { id: { not: session.user.id } },
                select: { id: true, name: true, email: true, image: true, role: true, title: true },
            }),
            prisma.customer.findMany({
                where: { status: 'active' },
                select: { id: true, firstName: true, lastName: true, email: true, image: true },
            }),
        ])

        const contacts = [
            ...users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                img: u.image || '/img/avatars/thumb-1.jpg',
                type: 'staff',
                role: u.role,
                title: u.title,
            })),
            ...customers.map((c) => ({
                id: c.id,
                name: `${c.firstName} ${c.lastName}`,
                email: c.email,
                img: c.image || '/img/avatars/thumb-1.jpg',
                type: 'client',
            })),
        ]

        return NextResponse.json(contacts)
    } catch (error) {
        console.error('GET /api/contacts error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
