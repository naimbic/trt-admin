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
    }))

    return { list, total }
}

export default getCustomers
