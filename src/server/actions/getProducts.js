'use server'
import prisma from '@/lib/prisma'

const getProducts = async (_queryParams) => {
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
                  { name: { contains: query, mode: 'insensitive' } },
                  { sku: { contains: query, mode: 'insensitive' } },
              ],
          }
        : {}

    const orderBy = sortKey
        ? { [sortKey]: order === 'desc' ? 'desc' : 'asc' }
        : { createdAt: 'desc' }

    const [products, total] = await Promise.all([
        prisma.product.findMany({ where, orderBy, skip, take: size }),
        prisma.product.count({ where }),
    ])

    const list = products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        sku: p.sku,
        price: p.price,
        stock: p.stock,
        status: p.status === 'published' ? 0 : p.status === 'draft' ? 1 : 2,
        category: p.category,
        brand: p.brand,
        img: p.images[0] || '',
        images: p.images,
        tags: p.tags,
    }))

    return { list, total }
}

export default getProducts
