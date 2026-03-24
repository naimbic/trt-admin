import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const countries = ['MA', 'FR', 'US', 'DE', 'ES', 'GB', 'BE', 'SA', 'TN', 'AE']
const cities = ['Casablanca', 'Paris', 'New York', 'Berlin', 'Madrid', 'London', 'Brussels', 'Riyadh', 'Tunis', 'Dubai']
const statuses = ['draft', 'sent', 'paid', 'paid', 'paid', 'overdue', 'paid', 'sent']
const paymentMethods = ['bank_transfer', 'cash', 'check', 'card']

async function main() {
    console.log('🌱 Seeding test data (customers + invoices)...')

    // Create 10 customers
    const customerData = [
        { firstName: 'Youssef', lastName: 'El Amrani', email: 'youssef@example.com', phone: '+212661000001', country: 'MA', city: 'Casablanca', address: '12 Bd Zerktouni', postcode: '20000' },
        { firstName: 'Sophie', lastName: 'Dupont', email: 'sophie@example.com', phone: '+33612000002', country: 'FR', city: 'Paris', address: '45 Rue de Rivoli', postcode: '75001' },
        { firstName: 'James', lastName: 'Wilson', email: 'james@example.com', phone: '+14155000003', country: 'US', city: 'New York', address: '350 5th Ave', postcode: '10118' },
        { firstName: 'Hans', lastName: 'Mueller', email: 'hans@example.com', phone: '+49301000004', country: 'DE', city: 'Berlin', address: 'Friedrichstr. 43', postcode: '10117' },
        { firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', phone: '+34911000005', country: 'ES', city: 'Madrid', address: 'Gran Via 28', postcode: '28013' },
        { firstName: 'Omar', lastName: 'Benali', email: 'omar@example.com', phone: '+212662000006', country: 'MA', city: 'Rabat', address: 'Av Hassan II', postcode: '10000' },
        { firstName: 'Fatima', lastName: 'Zahra', email: 'fatima@example.com', phone: '+212663000007', country: 'MA', city: 'Marrakech', address: 'Rue Bab Agnaou', postcode: '40000' },
        { firstName: 'Ahmed', lastName: 'Al Rashid', email: 'ahmed@example.com', phone: '+966501000008', country: 'SA', city: 'Riyadh', address: 'King Fahd Rd', postcode: '11564' },
        { firstName: 'Emma', lastName: 'Brown', email: 'emma@example.com', phone: '+44201000009', country: 'GB', city: 'London', address: '10 Downing St', postcode: 'SW1A 2AA' },
        { firstName: 'Karim', lastName: 'Tazi', email: 'karim.tazi@example.com', phone: '+212664000010', country: 'MA', city: 'Fes', address: 'Av des FAR', postcode: '30000' },
    ]

    const customers = []
    for (const c of customerData) {
        const existing = await prisma.customer.findUnique({ where: { email: c.email } })
        if (existing) {
            customers.push(existing)
            console.log(`  ⏭ Customer ${c.email} already exists`)
        } else {
            const created = await prisma.customer.create({
                data: {
                    ...c,
                    status: 'active',
                    totalSpending: 0,
                    image: `/img/avatars/thumb-${customers.length + 1}.jpg`,
                },
            })
            customers.push(created)
            console.log(`  ✅ Customer created: ${c.firstName} ${c.lastName}`)
        }
    }

    // Create 20 invoices spread across customers and time periods
    const now = new Date()
    const invoiceData = []

    for (let i = 0; i < 20; i++) {
        const customer = customers[i % customers.length]
        const daysAgo = Math.floor(Math.random() * 180) // spread over last 6 months
        const createdAt = new Date(now)
        createdAt.setDate(createdAt.getDate() - daysAgo)

        const status = statuses[i % statuses.length]
        const itemCount = 1 + Math.floor(Math.random() * 3)
        const items = []
        let subtotal = 0

        for (let j = 0; j < itemCount; j++) {
            const qty = 1 + Math.floor(Math.random() * 5)
            const unitPrice = [500, 1000, 1500, 2000, 2500, 3000, 5000, 7500][Math.floor(Math.random() * 8)]
            const total = qty * unitPrice
            subtotal += total
            items.push({
                description: ['Web Development', 'SEO Audit', 'Social Media Management', 'Logo Design', 'Content Writing', 'Google Ads Campaign', 'Email Marketing', 'Consulting'][Math.floor(Math.random() * 8)],
                quantity: qty,
                unit: 'Unité',
                unitPrice,
                total,
            })
        }

        const taxRate = 20
        const taxAmount = subtotal * (taxRate / 100)
        const total = subtotal + taxAmount
        const mm = String(createdAt.getMonth() + 1).padStart(2, '0')
        const yyyy = createdAt.getFullYear()
        const num = String(i + 1).padStart(3, '0')
        const number = `FA-${num}/${mm}/${yyyy}`

        const dueDate = new Date(createdAt)
        dueDate.setDate(dueDate.getDate() + 30)

        invoiceData.push({
            number,
            customerId: customer.id,
            status,
            type: i < 17 ? 'invoice' : 'devis',
            subtotal,
            taxRate,
            taxAmount,
            total,
            currency: 'MAD',
            notes: null,
            dueDate,
            paidDate: status === 'paid' ? new Date(createdAt.getTime() + 7 * 86400000) : null,
            paymentMethod: status === 'paid' ? paymentMethods[Math.floor(Math.random() * paymentMethods.length)] : null,
            paymentAmount: status === 'paid' ? total : null,
            paymentDate: status === 'paid' ? new Date(createdAt.getTime() + 7 * 86400000) : null,
            createdAt,
            items,
        })
    }

    for (const inv of invoiceData) {
        const existing = await prisma.invoice.findUnique({ where: { number: inv.number } })
        if (existing) {
            console.log(`  ⏭ Invoice ${inv.number} already exists`)
            continue
        }
        const { items, ...invoiceFields } = inv
        await prisma.invoice.create({
            data: {
                ...invoiceFields,
                items: { create: items },
            },
        })
        console.log(`  ✅ Invoice created: ${inv.number} (${inv.status}) - ${inv.total.toFixed(2)} MAD`)
    }

    // Update customer totalSpending based on paid invoices
    for (const customer of customers) {
        const paidInvoices = await prisma.invoice.findMany({
            where: { customerId: customer.id, status: 'paid' },
            select: { total: true },
        })
        const totalSpending = paidInvoices.reduce((s, i) => s + (i.total || 0), 0)
        await prisma.customer.update({
            where: { id: customer.id },
            data: { totalSpending },
        })
    }

    console.log('🎉 Test data seeding complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
