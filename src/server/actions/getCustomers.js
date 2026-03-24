'use server'
import prisma from '@/lib/prisma'

const getCustomers = async (_queryParams) => {
    const {
        pageIndex = '1',
        pageSize = '10',
        sortKey = '',
        order,
        query,
    } = _queryParams

    const page = parseInt(pageIndex)
    const size = parseInt(pageSize)
    const skip = (page - 1) * size

    const where = query
        ? {
              OR: [
                  { firstName: { contains: query, mode: 'insensitive' } },
                  { lastName: { contains: query, mode: 'insensitive' } },
                  { email: { contains: query, mode: 'insensitive' } },
              ],
          }
        : {}

    const orderBy = sortKey
        ? { [sortKey === 'name' ? 'firstName' : sortKey]: order === 'desc' ? 'desc' : 'asc' }
        : { createdAt: 'desc' }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where,
            orderBy,
            skip,
            take: size,
        }),
        prisma.customer.count({ where }),
    ])

    // Fetch invoice counts per customer
    const customerIds = customers.map(c => c.id)
    const invoices = customerIds.length
        ? await prisma.invoice.findMany({
              where: { customerId: { in: customerIds }, type: 'invoice' },
              select: { customerId: true, status: true, total: true },
          })
        : []

    const invoiceMap = {}
    invoices.forEach(inv => {
        if (!inv.customerId) return
        if (!invoiceMap[inv.customerId]) invoiceMap[inv.customerId] = { paid: 0, unpaid: 0, totalPaid: 0, totalUnpaid: 0 }
        if (inv.status === 'paid') {
            invoiceMap[inv.customerId].paid += 1
            invoiceMap[inv.customerId].totalPaid += inv.total || 0
        } else if (inv.status !== 'cancelled') {
            invoiceMap[inv.customerId].unpaid += 1
            invoiceMap[inv.customerId].totalUnpaid += inv.total || 0
        }
    })

    const list = customers.map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        img: c.image,
        status: c.status,
        totalSpending: c.totalSpending,
        personalInfo: {
            location: c.location,
            city: c.city,
            country: c.country,
            phone: c.phone,
        },
        invoices: invoiceMap[c.id] || { paid: 0, unpaid: 0, totalPaid: 0, totalUnpaid: 0 },
    }))

    return { list, total }
}

export default getCustomers
