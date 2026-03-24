import prisma from '@/lib/prisma'

const DEFAULT_ROLES = [
    { roleId: 'admin', name: 'Admin', description: 'Full access to all functionalities and settings. Can manage users, roles, and configurations.', accessRight: { users: ['write','read','delete'], products: ['write','read','delete'], configurations: ['write','read','delete'], files: ['write','read','delete'], reports: ['write','read','delete'], invoices: ['write','read','delete'] }, order: 0 },
    { roleId: 'supervisor', name: 'Supervisor', description: 'Oversees operations and users. Can view reports and has limited configuration access.', accessRight: { users: ['write','read'], products: ['write','read'], configurations: ['write','read'], files: ['write','read'], reports: ['read'], invoices: ['write','read'] }, order: 1 },
    { roleId: 'support', name: 'Support', description: 'Provides technical assistance. Can access user accounts and system reports for diagnostics.', accessRight: { users: ['read'], products: ['write','read'], configurations: ['read'], files: ['write','read'], reports: ['read'] }, order: 2 },
    { roleId: 'user', name: 'User', description: 'Access to basic features necessary for tasks. Limited administrative privileges.', accessRight: { users: [], products: ['read'], configurations: [], files: ['write','read'], reports: [] }, order: 3 },
    { roleId: 'auditor', name: 'Auditor', description: 'Reviews system activities. Can access reports, but cannot make changes.', accessRight: { users: ['read'], products: ['read'], configurations: [], files: ['read'], reports: ['read'] }, order: 4 },
    { roleId: 'guest', name: 'Guest', description: 'Temporary access to limited features. Ideal for visitors or temporary users.', accessRight: { users: [], products: ['read'], configurations: [], files: [], reports: [] }, order: 5 },
]

const getRolesPermissionsRoles = async () => {
    let roles = await prisma.role.findMany({ orderBy: { order: 'asc' } })

    if (roles.length === 0) {
        await prisma.role.createMany({ data: DEFAULT_ROLES })
        roles = await prisma.role.findMany({ orderBy: { order: 'asc' } })
    }

    const users = await prisma.user.findMany({
        select: { id: true, name: true, image: true, role: true },
    })

    return roles.map((r) => ({
        id: r.roleId,
        name: r.name,
        description: r.description,
        accessRight: r.accessRight,
        users: users
            .filter((u) => u.role === r.roleId)
            .map((u) => ({ id: u.id, name: u.name, img: u.image })),
    }))
}

export default getRolesPermissionsRoles
