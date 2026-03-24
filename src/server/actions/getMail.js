import prisma from '@/lib/prisma'
import { auth } from '@/auth'

const getMail = async (_queryParams) => {
    const { mail: id } = _queryParams || {}

    if (!id) return {}

    const session = await auth()
    if (!session?.user?.id) return {}

    const thread = await prisma.mailThread.findFirst({
        where: { id, ownerId: session.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!thread) return {}

    return {
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
    }
}

export default getMail
