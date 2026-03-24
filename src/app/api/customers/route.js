import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import getCustomers from '@/server/actions/getCustomers'

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams
        const response = await getCustomers({
            pageIndex: searchParams.get('pageIndex') || undefined,
            pageSize: searchParams.get('pageSize') || undefined,
            sortKey: searchParams.get('sortKey') || undefined,
            order: searchParams.get('order') || undefined,
            query: searchParams.get('query') || undefined,
        })
        return NextResponse.json(response)
    } catch (error) {
        console.error('GET /api/customers error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        const data = {
            firstName: body.firstName,
            lastName: body.lastName,
            email: body.email,
            phone: body.phoneNumber || null,
            dialCode: body.dialCode || null,
            image: body.img || null,
            country: body.country || null,
            address: body.address || null,
            city: body.city || null,
            postcode: body.postcode || null,
            location: body.location || null,
            birthday: body.birthday ? new Date(body.birthday) : null,
            gender: body.gender || null,
            facebook: body.facebook || null,
            twitter: body.twitter || null,
            linkedIn: body.linkedIn || null,
            pinterest: body.pinterest || null,
            deliveryAddress: body.deliveryAddress || null,
            deliveryCity: body.deliveryCity || null,
            deliveryCountry: body.deliveryCountry || null,
            deliveryPostcode: body.deliveryPostcode || null,
        }
        if (body.password) {
            const bcrypt = await import('bcryptjs')
            data.password = await bcrypt.default.hash(body.password, 10)
        }

        const customer = await prisma.customer.create({ data })

        return NextResponse.json({ success: true, id: customer.id })
    } catch (error) {
        console.error('POST /api/customers error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A customer with this email already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
