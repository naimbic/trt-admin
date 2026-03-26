const { PrismaClient } = require('@prisma/client')

async function main() {
    const p = new PrismaClient()

    // Get all raw docs
    const raw = await p.$runCommandRaw({
        find: 'error_logs',
        limit: 1000,
    })
    const docs = raw.cursor.firstBatch
    console.log('Total docs:', docs.length)

    for (const doc of docs) {
        const id = doc._id.$oid || doc._id
        const updates = {}
        const unsets = {}

        // Fix path from url
        if (!doc.path && doc.url) {
            updates.path = doc.url
        }

        // Fix hitCount
        if (!doc.hitCount || typeof doc.hitCount !== 'number') {
            updates.hitCount = 1
        }

        // Fix updatedAt — must be proper ISODate
        if (!doc.updatedAt || typeof doc.updatedAt === 'string') {
            updates.updatedAt = { $date: new Date().toISOString() }
        }

        // Fix createdAt
        if (!doc.createdAt || typeof doc.createdAt === 'string') {
            const fallback = doc.date?.$date || doc.date || new Date().toISOString()
            updates.createdAt = { $date: typeof fallback === 'string' ? fallback : new Date(fallback).toISOString() }
        }

        // Remove old fields
        if (doc.url !== undefined) unsets.url = ''
        if (doc.ua !== undefined) unsets.ua = ''
        if (doc.date !== undefined) unsets.date = ''

        const cmd = {}
        if (Object.keys(updates).length > 0) cmd.$set = updates
        if (Object.keys(unsets).length > 0) cmd.$unset = unsets

        if (Object.keys(cmd).length > 0) {
            await p.$runCommandRaw({
                update: 'error_logs',
                updates: [{
                    q: { _id: { $oid: id } },
                    u: cmd,
                }],
            })
            console.log('Fixed:', doc.path || doc.url)
        }
    }

    // Deduplicate
    const dupes = await p.$runCommandRaw({
        aggregate: 'error_logs',
        pipeline: [
            { $group: { _id: '$path', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } },
        ],
        cursor: {},
    })

    for (const d of dupes.cursor.firstBatch) {
        const all = await p.$runCommandRaw({
            find: 'error_logs',
            filter: { path: d._id },
            sort: { hitCount: -1 },
            limit: 100,
        })
        const keep = all.cursor.firstBatch[0]
        const removeIds = all.cursor.firstBatch.slice(1).map(x => ({ $oid: x._id.$oid }))
        if (removeIds.length > 0) {
            await p.$runCommandRaw({
                delete: 'error_logs',
                deletes: [{ q: { _id: { $in: removeIds } }, limit: 0 }],
            })
            console.log('Deduped:', d._id, 'removed:', removeIds.length)
        }
    }

    // Verify
    const final = await p.$runCommandRaw({
        find: 'error_logs',
        sort: { hitCount: -1 },
        limit: 20,
    })
    console.log('\nFinal:', final.cursor.firstBatch.length, 'records')
    final.cursor.firstBatch.forEach(d => console.log(d.path, 'hits:', d.hitCount))

    // Test Prisma query
    try {
        const result = await p.errorLog.findMany({ orderBy: { hitCount: 'desc' }, take: 5 })
        console.log('\nPrisma query works! Got', result.length, 'records')
        result.forEach(e => console.log(e.path, 'hits:', e.hitCount))
    } catch (err) {
        console.log('\nPrisma query FAILED:', err.message.substring(0, 200))
    }

    await p.$disconnect()
}

main().catch(console.error)
