import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                currentPlan: true,
                planStatus: true,
                billingCycle: true,
                nextPaymentDate: true,
                planAmount: true,
                paymentMethods: true,
                transactions: {
                    orderBy: { date: 'desc' },
                    take: 20,
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({
            currentPlan: {
                plan: user.currentPlan || 'Business board basic',
                status: user.planStatus || 'active',
                billingCycle: user.billingCycle || 'monthly',
                nextPaymentDate: user.nextPaymentDate || null,
                amount: user.planAmount || 0,
            },
            paymentMethods: user.paymentMethods.map((pm) => ({
                cardId: pm.id,
                cardHolderName: pm.cardHolderName,
                cardType: pm.cardType,
                expMonth: pm.expMonth,
                expYear: pm.expYear,
                last4Number: pm.last4Number,
                primary: pm.primary,
            })),
            transactionHistory: user.transactions.map((t) => ({
                id: `#${t.id.slice(-5)}`,
                item: t.item,
                status: t.status,
                amount: t.amount,
                date: t.date,
            })),
        })
    } catch (error) {
        console.error('GET /api/setting/billing error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action } = body

        if (action === 'updatePlan') {
            await prisma.user.update({
                where: { id: session.user.id },
                data: {
                    currentPlan: body.plan,
                    planStatus: body.status,
                    billingCycle: body.billingCycle,
                    nextPaymentDate: body.nextPaymentDate,
                    planAmount: body.amount,
                },
            })
            return NextResponse.json({ success: true })
        }

        if (action === 'addPaymentMethod') {
            const pm = await prisma.userPaymentMethod.create({
                data: {
                    userId: session.user.id,
                    cardHolderName: body.cardHolderName,
                    cardType: body.cardType,
                    last4Number: body.last4Number,
                    expMonth: body.expMonth,
                    expYear: body.expYear,
                    primary: body.primary || false,
                },
            })
            return NextResponse.json({ success: true, data: { cardId: pm.id } })
        }

        if (action === 'editPaymentMethod') {
            await prisma.userPaymentMethod.update({
                where: { id: body.cardId },
                data: {
                    cardHolderName: body.cardHolderName,
                    cardType: body.cardType,
                    last4Number: body.last4Number,
                    expMonth: body.expMonth,
                    expYear: body.expYear,
                    primary: body.primary,
                },
            })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('PUT /api/setting/billing error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}