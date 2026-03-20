'use server'
import prisma from '@/lib/prisma'

const getOrderDetails = async (_queryParams) => {
    const { id } = _queryParams

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            customer: true,
            items: { include: { product: true } },
            timeline: { orderBy: { date: 'desc' } },
        },
    })

    if (!order) return {}

    return {
        id: order.id,
        paymentStatus: order.status,
        paymentSummary: {
            subTotal: order.totalAmount,
            delivery: 0,
            tax: 0,
            total: order.totalAmount,
        },
        shipping: {
            deliveryFees: 0,
            estimatedMin: 3,
            estimatedMax: 5,
            shippingLogo: '',
            shippingVendor: 'Standard',
        },
        activity: order.timeline.map((t) => ({
            date: Math.floor(t.date.getTime() / 1000),
            events: [{ time: Math.floor(t.date.getTime() / 1000), action: t.action, recipient: t.note || '' }],
        })),
        customer: {
            name: `${order.customer.firstName} ${order.customer.lastName}`,
            email: order.customer.email,
            phone: order.customer.phone || '',
            img: order.customer.image || '',
            previousOrder: 0,
            shippingAddress: {
                line1: order.shippingAddress || '',
                line2: '',
                city: order.shippingCity || '',
                state: '',
                zipCode: order.shippingZip || '',
                country: order.shippingCountry || '',
            },
            billingAddress: {
                line1: order.shippingAddress || '',
                line2: '',
                city: order.shippingCity || '',
                state: '',
                zipCode: order.shippingZip || '',
                country: order.shippingCountry || '',
            },
        },
        products: order.items.map((item) => ({
            id: item.productId,
            name: item.name,
            img: item.product?.images?.[0] || '',
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
        })),
    }
}

export default getOrderDetails
