import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET(request) {
    try {
        const searchParams = request.nextUrl.searchParams
        const pageIndex = parseInt(searchParams.get('pageIndex') || '1', 10)
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
        const query = searchParams.get('query') || ''
        const status = searchParams.get('status') || ''
        const type = searchParams.get('type') || ''
        const sortKey = searchParams.get('sortKey') || 'createdAt'
        const order = searchParams.get('order') || 'desc'
        const customerId = searchParams.get('customerId') || ''
        const period = searchParams.get('period') || ''

        const where = {}
        if (customerId) where.customerId = customerId

        // Period date filtering
        if (period) {
            const now = new Date()
            let start
            switch (period) {
                case 'today':
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    break
                case 'week':
                    start = new Date(now)
                    start.setDate(now.getDate() - now.getDay())
                    start.setHours(0, 0, 0, 0)
                    break
                case 'month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1)
                    break
                case 'quarter':
                    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
                    break
                case 'year':
                    start = new Date(now.getFullYear(), 0, 1)
                    break
            }
            if (start) where.createdAt = { gte: start }
        }

        if (query) {
            where.OR = [
                { number: { contains: query, mode: 'insensitive' } },
                { notes: { contains: query, mode: 'insensitive' } },
            ]
        }
        if (status) where.status = status
        if (type) where.type = type

        const [list, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                include: { items: true },
                orderBy: { [sortKey]: order },
                skip: (pageIndex - 1) * pageSize,
                take: pageSize,
            }),
            prisma.invoice.count({ where }),
        ])

        // Resolve customer names
        const customerIds = [...new Set(list.filter(i => i.customerId).map(i => i.customerId))]
        const customers = customerIds.length
            ? await prisma.customer.findMany({
                  where: { id: { in: customerIds } },
                  select: { id: true, firstName: true, lastName: true, email: true },
              })
            : []
        const customerMap = Object.fromEntries(customers.map(c => [c.id, c]))

        const data = list.map(inv => ({
            ...inv,
            customer: inv.customerId ? customerMap[inv.customerId] || null : null,
        }))

        return NextResponse.json({ list: data, total })
    } catch (error) {
        console.error('GET /api/invoices error:', error)
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

        // Auto-generate invoice number: FA-NNN/MM/YYYY
        const now = new Date()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const yyyy = now.getFullYear()
        const suffix = `/${mm}/${yyyy}`

        // Find the highest number for this month/year
        const existing = await prisma.invoice.findMany({
            where: { number: { endsWith: suffix } },
            select: { number: true },
            orderBy: { number: 'desc' },
        })
        let nextNum = 1
        if (existing.length > 0) {
            // Extract max number from FA-NNN/MM/YYYY
            const nums = existing.map(inv => {
                const match = inv.number.match(/^FA-(\d+)\//)
                return match ? parseInt(match[1], 10) : 0
            })
            nextNum = Math.max(...nums) + 1
        }
        const number = `FA-${String(nextNum).padStart(3, '0')}${suffix}`

        // Calculate totals from items
        const items = Array.isArray(body.items) ? body.items : []
        const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1), 0)
        const taxRate = parseFloat(body.taxRate) || 20
        const taxAmount = subtotal * (taxRate / 100)
        const total = subtotal + taxAmount

        const invoice = await prisma.invoice.create({
            data: {
                number,
                customerId: body.customerId || null,
                status: body.status || 'draft',
                type: body.type || 'invoice',
                subtotal,
                taxRate,
                taxAmount,
                total,
                currency: body.currency || 'MAD',
                notes: body.notes || null,
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
                recurring: body.recurring || false,
                recurringPeriod: body.recurringPeriod || null,
                recurringCycles: body.recurringCycles != null ? parseInt(body.recurringCycles) : null,
                paymentMethod: body.paymentMethod || null,
                paymentAmount: body.paymentAmount != null ? parseFloat(body.paymentAmount) : null,
                paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
                items: {
                    create: items.map(item => ({
                        description: item.description || '',
                        quantity: parseInt(item.quantity) || 1,
                        unit: item.unit || 'Unité',
                        unitPrice: parseFloat(item.unitPrice) || 0,
                        total: (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 1),
                    })),
                },
            },
            include: { items: true },
        })

        return NextResponse.json({ success: true, id: invoice.id, number: invoice.number })
    } catch (error) {
        console.error('POST /api/invoices error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
