'use server'
import prisma from '@/lib/prisma'

const getLogs = async (activityIndex = 1, filter) => {
    const maxGetItem = 10
    const skip = (activityIndex - 1) * maxGetItem

    const where = filter && filter.length > 0 ? { entity: { in: filter } } : {}

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            orderBy: { date: 'desc' },
            skip,
            take: maxGetItem,
            include: { user: { select: { name: true, image: true } } },
        }),
        prisma.activityLog.count({ where }),
    ])

    const loadable = skip + logs.length < total

    // Group by date
    const grouped = {}
    logs.forEach((log) => {
        const dateKey = log.date.toISOString().split('T')[0]
        if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, events: [] }
        grouped[dateKey].events.push({
            type: log.entity || 'system',
            dateTime: Math.floor(log.date.getTime() / 1000),
            ticket: log.entityId || '',
            status: log.action,
            userName: log.user?.name || 'System',
            userImg: log.user?.image || '',
        })
    })

    return {
        data: Object.values(grouped),
        loadable,
    }
}

export default getLogs
