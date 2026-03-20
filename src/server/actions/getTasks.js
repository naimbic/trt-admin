'use server'
import prisma from '@/lib/prisma'

async function getTasks() {
    const tasks = await prisma.task.findMany({
        include: { project: { select: { name: true } }, comments: true },
        orderBy: { createdAt: 'desc' },
    })

    return tasks.map((t) => ({
        id: t.id,
        name: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        assignee: t.assigneeId || '',
        dueDate: t.dueDate ? Math.floor(t.dueDate.getTime() / 1000) : null,
        tags: t.tags,
        projectName: t.project?.name || '',
        commentCount: t.comments.length,
    }))
}

export default getTasks
