'use server'
import prisma from '@/lib/prisma'

const getCustomer = async (_queryParams) => {
    const { id } = _queryParams

    const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
            orders: { orderBy: { createdAt: 'desc' }, take: 10 },
            paymentMethods: true,
            subscriptions: true,
        },
    })

    if (!customer) return {}

    return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        img: customer.image,
        status: customer.status,
        totalSpending: customer.totalSpending,
        personalInfo: {
            location: customer.location,
            address: customer.address,
            city: customer.city,
            country: customer.country,
            postcode: customer.postcode,
            phoneNumber: customer.phone,
            birthday: customer.birthday,
            gender: customer.gender,
            facebook: customer.facebook,
            twitter: customer.twitter,
            pinterest: customer.pinterest,
            linkedIn: customer.linkedIn,
        },
        orderHistory: customer.orders.map((o) => ({
            id: o.id,
            item: `Order #${o.id.slice(-5)}`,
            status: ['pending', 'paid', 'shipped', 'delivered'][o.status],
            amount: o.totalAmount,
            date: o.createdAt.getTime() / 1000,
        })),
        paymentMethod: customer.paymentMethods.map((p) => ({
            cardType: p.cardType,
            last4Number: p.last4Number,
            expMonth: p.expMonth,
            expYear: p.expYear,
            primary: p.primary,
        })),
        subscription: customer.subscriptions.map((s) => ({
            plan: s.plan,
            status: s.status,
            billing: s.billing,
            amount: s.amount,
        })),
    }
}

export default getCustomer
