import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const prisma = new PrismaClient()

async function main() {
    const jsonPath = resolve(__dirname, '../src/data/changelog.json')
    const entries = JSON.parse(readFileSync(jsonPath, 'utf-8'))

    console.log(`Found ${entries.length} changelog entries in JSON`)

    // Clear existing backend entries
    const deleted = await prisma.changelog.deleteMany({ where: { project: 'backend' } })
    console.log(`Deleted ${deleted.count} existing backend entries`)

    // Insert all entries as backend project
    let created = 0
    for (const entry of entries) {
        await prisma.changelog.create({
            data: {
                version: entry.version || null,
                message: entry.message,
                type: entry.type || 'update',
                project: 'backend',
                files: entry.files || [],
                date: entry.date ? new Date(entry.date) : new Date(),
            },
        })
        created++
    }

    console.log(`✅ Imported ${created} backend changelog entries to MongoDB`)
}

main()
    .catch((e) => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
