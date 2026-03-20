'use server'
import prisma from '@/lib/prisma'

const getProduct = async (_queryParams) => {
    const { id } = _queryParams

    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) return null

    return {
        id: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        price: product.price,
        stock: product.stock,
        status: product.status === 'published' ? 0 : product.status === 'draft' ? 1 : 2,
        category: product.category,
        brand: product.brand,
        taxRate: product.taxRate,
        img: product.images[0] || '',
        images: product.images,
        tags: product.tags,
    }
}

export default getProduct
