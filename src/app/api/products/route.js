import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import getProducts from '@/server/actions/getProducts'

export async function GET(request) {
    const searchParams = request.nextUrl.searchParams

    try {
        const response = await getProducts({
            pageIndex: searchParams.get('pageIndex') || undefined,
            pageSize: searchParams.get('pageSize') || undefined,
            sortKey: searchParams.get('sortKey') || undefined,
            order: searchParams.get('order') || undefined,
            query: searchParams.get('query') || undefined,
        })
        return NextResponse.json(response)
    } catch (error) {
        console.error('GET /api/products error:', error)
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

        // imgList comes as [{id, name, img}] from the form — flatten to URL strings
        const images = Array.isArray(body.imgList)
            ? body.imgList.map((item) => (typeof item === 'string' ? item : item.img)).filter(Boolean)
            : []

        const product = await prisma.product.create({
            data: {
                name: body.name,
                description: body.description || null,
                sku: body.productCode,
                price: parseFloat(body.price) || 0,
                taxRate: parseFloat(body.taxRate) || 0,
                category: body.category || null,
                brand: body.brand || null,
                images,
                tags: Array.isArray(body.tags)
                    ? body.tags.map((t) => (typeof t === 'string' ? t : t.value))
                    : [],
            },
        })

        return NextResponse.json({ success: true, id: product.id })
    } catch (error) {
        console.error('POST /api/products error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'A product with this SKU already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
