import prisma from '@/lib/prisma'
import { auth } from '@/auth'

const getMailList = async (_queryParams) => {
    const session = await auth()
    if (!session?.user?.id) return []

    const { category, label } = _queryParams || {}
    const userId = session.user.id

    const where = { ownerId: userId }

    if (label) {
        where.label = label
    } else if (category && category !== 'inbox') {
        where.group = category
    } else {
        where.group = { in: ['inbox', ''] }
    }

    const threads = await prisma.mailThread.findMany({
        where,
        include: { messages: { orderBy: { createdAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
    })

    return threads.map((thread) => ({
        id: thread.id,
        name: thread.name,
        from: thread.from,
        avatar: thread.avatar || '/img/avatars/thumb-1.jpg',
        title: thread.title,
        label: thread.label || '',
        group: thread.group,
        flagged: thread.flagged,
        starred: thread.starred,
        mail: thread.to,
        message: thread.messages.map((m) => ({
            id: m.id,
            name: m.name,
            mail: m.to,
            from: m.from,
            avatar: m.avatar || '/img/avatars/thumb-1.jpg',
            date: m.date,
            content: m.content,
            attachment: m.attachments || [],
        })),
    }))
}

export default getMailList
