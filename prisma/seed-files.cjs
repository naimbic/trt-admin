const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
    if (!admin) {
        console.log('No admin user found. Run main seed first.')
        return
    }

    // Clear existing files
    const deleted = await prisma.file.deleteMany({})
    console.log(`Cleared ${deleted.count} existing files`)

    // Create folders
    const docs = await prisma.file.create({
        data: { name: 'Documents', fileType: 'directory', size: 0, url: '', folder: null, uploadedBy: admin.id },
    })
    const images = await prisma.file.create({
        data: { name: 'Images', fileType: 'directory', size: 0, url: '', folder: null, uploadedBy: admin.id },
    })
    const projects = await prisma.file.create({
        data: { name: 'Projects', fileType: 'directory', size: 0, url: '', folder: null, uploadedBy: admin.id },
    })

    console.log(`Created folders: Documents (${docs.id}), Images (${images.id}), Projects (${projects.id})`)

    // Create sample file records (no S3 upload — use the UI to upload real files)
    const files = [
        { name: 'README.txt', fileType: 'text', size: 64, url: '', folder: docs.id, uploadedBy: admin.id },
        { name: 'Meeting_Notes.doc', fileType: 'doc', size: 12400, url: '', folder: docs.id, uploadedBy: admin.id },
        { name: 'Budget_2026.csv', fileType: 'csv', size: 3200, url: '', folder: null, uploadedBy: admin.id },
        { name: 'Project_Plan.pdf', fileType: 'pdf', size: 245000, url: '', folder: projects.id, uploadedBy: admin.id },
        { name: 'Brand_Guidelines.pdf', fileType: 'pdf', size: 1580000, url: '', folder: null, uploadedBy: admin.id },
    ]

    for (const f of files) {
        const created = await prisma.file.create({ data: f })
        console.log(`Created file: ${created.name} in ${f.folder ? 'folder' : 'root'}`)
    }

    console.log('\nDone! 3 folders + 5 files seeded.')
}

main()
    .catch((e) => { console.error('Seed error:', e); process.exit(1) })
    .finally(() => prisma.$disconnect())
