'use server'
import prisma from '@/lib/prisma'

const getOrderList = async (_queryParams) => {
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
                  { id: { contains: query } },
                  { customer: { firstName: { contains: query, mode: 'insensitive' } } },
                  { customer: { lastName: { contains: query, mode: 'insensitive' } } },
              ],
          }
        : {}

    const orderBy = sortKey
        ? { [sortKey === 'date' ? 'createdAt' : sortKey]: order === 'desc' ? 'desc' : 'asc' }
        : { createdAt: 'desc' }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy,
            skip,
            take: size,
            include: { customer: true },
        }),
        prisma.order.count({ where }),
    ])

    const list = orders.map((o) => ({
        id: o.id,
        date: Math.floor(o.createdAt.getTime() / 1000),
        customer: `${o.customer.firstName} ${o.customer.lastName}`,
        status: o.status,
        paymentMehod: o.paymentMethod,
        paymentIdendifier: o.paymentId,
        totalAmount: o.totalAmount,
    }))

    return { list, total }
}

export default getOrderList
