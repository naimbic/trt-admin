'use server'
import prisma from '@/lib/prisma'

const getProjects = async () => {
    const projects = await prisma.project.findMany({
        include: { tasks: { select: { id: true, status: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        status: p.status,
        progress: p.progress,
        startDate: p.startDate ? Math.floor(p.startDate.getTime() / 1000) : null,
        dueDate: p.dueDate ? Math.floor(p.dueDate.getTime() / 1000) : null,
        member: (p.memberIds || []).map((id) => ({ id, img: '/img/avatars/thumb-1.jpg' })),
        totalTask: p.tasks.length,
        completedTask: p.tasks.filter((t) => t.status === 'done').length,
    }))
}

export default getProjects
