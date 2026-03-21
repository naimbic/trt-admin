import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Clean existing data
    await prisma.changelog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.activityLog.deleteMany()
    await prisma.taskComment.deleteMany()
    await prisma.task.deleteMany()
    await prisma.project.deleteMany()
    await prisma.orderTimeline.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.order.deleteMany()
    await prisma.subscription.deleteMany()
    await prisma.paymentMethod.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.product.deleteMany()
    await prisma.article.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.user.deleteMany()

    // Create admin user
    const adminName = process.env.ADMIN_NAME || 'Admin'
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
        console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
        process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    const admin = await prisma.user.create({
        data: {
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            authority: ['admin', 'user'],
            image: '/img/avatars/thumb-1.jpg',
        },
    })
    console.log('✅ Admin user created:', admin.email)

    // Create customers
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                firstName: 'Angelina', lastName: 'Gotelli',
                email: 'angelina@example.com', phone: '+212600000001',
                status: 'active', totalSpending: 1250.50,
                location: 'Casablanca, Morocco', city: 'Casablanca', country: 'MA',
                image: '/img/avatars/thumb-1.jpg',
            },
        }),
        prisma.customer.create({
            data: {
                firstName: 'Jeremiah', lastName: 'Minsk',
                email: 'jeremiah@example.com', phone: '+212600000002',
                status: 'active', totalSpending: 890.00,
                location: 'Rabat, Morocco', city: 'Rabat', country: 'MA',
                image: '/img/avatars/thumb-2.jpg',
            },
        }),
        prisma.customer.create({
            data: {
                firstName: 'Max', lastName: 'Alexander',
                email: 'max@example.com', phone: '+212600000003',
                status: 'active', totalSpending: 2340.75,
                location: 'Marrakech, Morocco', city: 'Marrakech', country: 'MA',
                image: '/img/avatars/thumb-3.jpg',
            },
        }),
        prisma.customer.create({
            data: {
                firstName: 'Shannon', lastName: 'Baker',
                email: 'shannon@example.com', phone: '+212600000004',
                status: 'blocked', totalSpending: 150.00,
                location: 'Tangier, Morocco', city: 'Tangier', country: 'MA',
                image: '/img/avatars/thumb-4.jpg',
            },
        }),
        prisma.customer.create({
            data: {
                firstName: 'Karim', lastName: 'Benali',
                email: 'karim@example.com', phone: '+212600000005',
                status: 'active', totalSpending: 3100.00,
                location: 'Fes, Morocco', city: 'Fes', country: 'MA',
                image: '/img/avatars/thumb-5.jpg',
            },
        }),
    ])
    console.log('✅ Customers created:', customers.length)

    // Create products
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: 'TRT Premium Service', sku: 'TRT-SVC-001',
                price: 499.99, stock: 100, status: 'published',
                category: 'Services', brand: 'TRT Maroc',
                description: 'Premium consulting service package',
                images: ['/img/products/product-1.jpg'],
                tags: ['premium', 'service'],
            },
        }),
        prisma.product.create({
            data: {
                name: 'TRT Basic Package', sku: 'TRT-SVC-002',
                price: 199.99, stock: 200, status: 'published',
                category: 'Services', brand: 'TRT Maroc',
                description: 'Basic service package for small businesses',
                images: ['/img/products/product-2.jpg'],
                tags: ['basic', 'service'],
            },
        }),
        prisma.product.create({
            data: {
                name: 'TRT Enterprise Solution', sku: 'TRT-SVC-003',
                price: 1299.99, stock: 50, status: 'published',
                category: 'Enterprise', brand: 'TRT Maroc',
                description: 'Full enterprise solution with dedicated support',
                images: ['/img/products/product-3.jpg'],
                tags: ['enterprise', 'premium'],
            },
        }),
    ])
    console.log('✅ Products created:', products.length)

    // Create orders
    const orders = await Promise.all([
        prisma.order.create({
            data: {
                customerId: customers[0].id,
                status: 1, totalAmount: 499.99,
                paymentMethod: 'visa', paymentId: '•••• 6165',
                shippingAddress: '123 Rue Hassan II', shippingCity: 'Casablanca', shippingCountry: 'MA',
                items: {
                    create: [{ productId: products[0].id, name: products[0].name, quantity: 1, price: 499.99 }],
                },
                timeline: {
                    create: [
                        { action: 'Order placed', note: 'Customer placed the order' },
                        { action: 'Payment confirmed', note: 'Payment via Visa' },
                    ],
                },
            },
        }),
        prisma.order.create({
            data: {
                customerId: customers[2].id,
                status: 0, totalAmount: 1299.99,
                paymentMethod: 'master', paymentId: '•••• 0921',
                shippingAddress: '45 Avenue Mohammed V', shippingCity: 'Marrakech', shippingCountry: 'MA',
                items: {
                    create: [{ productId: products[2].id, name: products[2].name, quantity: 1, price: 1299.99 }],
                },
                timeline: {
                    create: [{ action: 'Order placed', note: 'Pending payment' }],
                },
            },
        }),
    ])
    console.log('✅ Orders created:', orders.length)

    // Create a project
    const project = await prisma.project.create({
        data: {
            name: 'TRT Maroc Website Redesign',
            description: 'Complete redesign of trtmaroc.com with new CRM dashboard',
            category: 'Web Development',
            status: 'in-progress',
            progress: 35,
            startDate: new Date('2026-01-15'),
            dueDate: new Date('2026-06-30'),
            tasks: {
                create: [
                    { title: 'Setup database & backend', status: 'done', priority: 'critical', tags: ['backend'] },
                    { title: 'Integrate CRM dashboard', status: 'in-progress', priority: 'high', tags: ['frontend'] },
                    { title: 'Customer management module', status: 'todo', priority: 'high', tags: ['crm'] },
                    { title: 'Order tracking system', status: 'todo', priority: 'medium', tags: ['crm'] },
                    { title: 'Arabic localization', status: 'todo', priority: 'medium', tags: ['i18n'] },
                ],
            },
        },
    })
    console.log('✅ Project created:', project.name)

    // Create changelog entry
    await prisma.changelog.create({
        data: {
            version: '1.0.0',
            message: 'Initial CRM setup with MongoDB backend',
            author: 'TRT Dev Team',
            type: 'feature',
        },
    })
    console.log('✅ Changelog entry created')

    console.log('🎉 Seeding complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
