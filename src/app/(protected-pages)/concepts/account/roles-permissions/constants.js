const rwdAccessor = [
    { label: 'Read', value: 'read' },
    { label: 'Write', value: 'write' },
    { label: 'Delete', value: 'delete' },
]

const rwAccessor = [
    { label: 'Read', value: 'read' },
    { label: 'Write', value: 'write' },
]

export const accessModules = [
    {
        id: 'users',
        name: 'User management',
        description: 'Access control for user management',
        accessor: rwdAccessor,
    },
    {
        id: 'customers',
        name: 'Customer management',
        description: 'Access control for customer operations',
        accessor: rwdAccessor,
    },
    {
        id: 'products',
        name: 'Products authority',
        description: 'Access control for product operations',
        accessor: rwdAccessor,
    },
    {
        id: 'invoices',
        name: 'Invoices & Quotes',
        description: 'Access control for invoices and devis',
        accessor: rwdAccessor,
    },
    {
        id: 'chat',
        name: 'Chat',
        description: 'Access control for messaging',
        accessor: rwdAccessor,
    },
    {
        id: 'mail',
        name: 'Mail',
        description: 'Access control for email',
        accessor: rwdAccessor,
    },
    {
        id: 'configurations',
        name: 'System configurations',
        description: 'Access control for system settings',
        accessor: rwdAccessor,
    },
    {
        id: 'files',
        name: 'File management',
        description: 'Access control for file management',
        accessor: rwdAccessor,
    },
    {
        id: 'reports',
        name: 'Reports',
        description: 'Access control for generating reports',
        accessor: rwdAccessor,
    },
]
