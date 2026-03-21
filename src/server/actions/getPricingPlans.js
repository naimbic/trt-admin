import prisma from '@/lib/prisma'

const DEFAULT_PLANS = [
    {
        planId: 'basic',
        name: 'Basic',
        description:
            'Ideal for individuals or small teams. Includes essential task and project management features.',
        monthlyPrice: 59,
        annualPrice: 500,
        features: ['taskManagement', 'managementTools', 'reporting', 'support'],
        recommended: false,
        order: 0,
    },
    {
        planId: 'standard',
        name: 'Standard',
        description:
            'Perfect for growing teams. Offers advanced features for better productivity and collaboration.',
        monthlyPrice: 79,
        annualPrice: 700,
        features: [
            'taskManagement',
            'managementTools',
            'reporting',
            'support',
            'fileSharing',
        ],
        recommended: false,
        order: 1,
    },
    {
        planId: 'pro',
        name: 'Pro',
        description:
            'Best for large teams. Includes premium features and dedicated support for optimal workflow.',
        monthlyPrice: 129,
        annualPrice: 1000,
        features: [
            'taskManagement',
            'managementTools',
            'reporting',
            'support',
            'fileSharing',
            'advancedSecurity',
            'customIntegrations',
        ],
        recommended: true,
        order: 2,
    },
]

const getPricingPlans = async () => {
    let plans = await prisma.pricingPlan.findMany({
        orderBy: { order: 'asc' },
    })

    if (plans.length === 0) {
        await prisma.pricingPlan.createMany({ data: DEFAULT_PLANS })
        plans = await prisma.pricingPlan.findMany({
            orderBy: { order: 'asc' },
        })
    }

    return {
        plans: plans.map((p) => ({
            id: p.planId,
            name: p.name,
            description: p.description,
            price: { monthly: p.monthlyPrice, annually: p.annualPrice },
            features: p.features,
            recommended: p.recommended,
        })),
    }
}

export default getPricingPlans
