'use server'
import prisma from '@/lib/prisma'

const getPageStats = async (queryParams = {}) => {
    const {
        pageIndex = '1',
        pageSize = '10',
        sortKey = 'views',
        order = 'desc',
        query,
    } = queryParams

    const page = parseInt(pageIndex)
    const size = parseInt(pageSize)
    const skip = (page - 1) * size

    const where = query
        ? { slug: { contains: query, mode: 'insensitive' } }
        : {}

    const validSortKeys = ['views', 'likes', 'shares', 'slug']
    const sortField = validSortKeys.includes(sortKey) ? sortKey : 'views'

    const orderBy = { [sortField]: order === 'asc' ? 'asc' : 'desc' }

    const [list, total] = await Promise.all([
        prisma.pageStat.findMany({
            where,
            orderBy,
            skip,
            take: size,
        }),
        prisma.pageStat.count({ where }),
    ])

    return { list, total }
}

export default getPageStats
