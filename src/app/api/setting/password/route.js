import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { currentPassword, newPassword } = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
        })

        if (!user?.password) {
            return NextResponse.json({ error: 'No password set for this account' }, { status: 400 })
        }

        const isValid = await bcrypt.compare(currentPassword, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PUT /api/setting/password error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}