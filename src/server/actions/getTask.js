'use server'
import prisma from '@/lib/prisma'

const getTask = async (_queryParams) => {
    const { id } = _queryParams

    const task = await prisma.task.findUnique({
        where: { id },
        include: {
            project: { select: { name: true } },
            comments: { orderBy: { date: 'desc' } },
        },
    })

    if (!task) return {}

    return {
        id: task.id,
        name: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assigneeId || '',
        dueDate: task.dueDate ? Math.floor(task.dueDate.getTime() / 1000) : null,
        tags: task.tags,
        projectName: task.project?.name || '',
        comments: task.comments.map((c) => ({
            id: c.id,
            userId: c.userId,
            content: c.content,
            date: Math.floor(c.date.getTime() / 1000),
        })),
    }
}

export default getTask
