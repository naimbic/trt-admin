import prisma from '@/lib/prisma'

const getRolesPermissionsUsers = async (queryParams = {}) => {
    const {
        pageIndex = '1',
        pageSize = '10',
        sortKey = '',
        order = 'asc',
        query = '',
        role = '',
        status = '',
    } = queryParams

    const where = {}
    if (role) where.role = role
    if (status) where.status = status
    if (query) {
        where.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
        ]
    }

    const total = await prisma.user.count({ where })

    const orderBy = sortKey
        ? { [sortKey]: order === 'desc' ? 'desc' : 'asc' }
        : { createdAt: 'desc' }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            status: true,
            lastOnline: true,
        },
        orderBy,
        skip: (parseInt(pageIndex) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
    })

    const list = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        img: u.image,
        role: u.role || 'user',
        status: u.status || 'active',
        lastOnline: u.lastOnline || Math.floor(Date.now() / 1000),
    }))

    return { list, total }
}

export default getRolesPermissionsUsers
