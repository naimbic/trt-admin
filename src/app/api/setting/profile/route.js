import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                image: true,
                phone: true,
                dialCode: true,
                country: true,
                address: true,
                city: true,
                postcode: true,
                birthday: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 },
            )
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email,
            img: user.image || '',
            address: user.address || '',
            postcode: user.postcode || '',
            city: user.city || '',
            country: user.country || '',
            dialCode: user.dialCode || '',
            birthday: user.birthday || '',
            phoneNumber: user.phone || '',
        })
    } catch (error) {
        console.error('GET profile error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        )
    }
}

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            )
        }

        const body = await request.json()

        // Build displayName so User.name stays in sync with session/JWT
        const displayName = [body.firstName, body.lastName]
            .filter(Boolean)
            .join(' ')

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: displayName || undefined,
                firstName: body.firstName,
                lastName: body.lastName,
                email: body.email,
                image: body.img,
                phone: body.phoneNumber,
                dialCode: body.dialCode,
                country: body.country,
                address: body.address,
                city: body.city,
                postcode: body.postcode,
                birthday: body.birthday,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PUT profile error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        )
    }
}
