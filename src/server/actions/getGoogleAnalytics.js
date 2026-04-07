import { unstable_noStore as noStore } from 'next/cache'
import dayjs from 'dayjs'
import prisma from '@/lib/prisma'
import {
    isGA4Configured,
    isSCConfigured,
    fetchGA4Visitors,
    fetchKeywordPositions,
    fetchSearchTraffic,
    fetchTopPages,
    fetchDeviceBreakdown,
    fetchCountryBreakdown,
    fetchIndexedPages,
    inspectUrl,
} from '@/lib/google-apis'

function slugToName(slug) {
    const s = slug.replace(/^(page-|portfolio-)/, '').replace(/-/g, ' ')
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function slugToType(slug) {
    if (slug.startsWith('portfolio-')) return 'Portfolio'
    if (slug.startsWith('page-')) return 'Page'
    return 'Blog'
}

function slugToPath(slug) {
    if (slug === 'page-home' || slug === 'page-index' || slug === 'page-index.backup') return '/'
    if (slug.startsWith('page-')) return '/' + slug.replace('page-', '')
    if (slug.startsWith('portfolio-')) return '/portfolio/' + slug.replace('portfolio-', '')
    return '/posts/' + slug
}

export default async function getGoogleAnalytics() {
    noStore()

    try {
        const startDate = dayjs().subtract(90, 'day').format('YYYY-MM-DD')
        const endDate = dayjs().format('YYYY-MM-DD')

        const ga4Configured = isGA4Configured()
        const scConfigured = isSCConfigured()

        // Run Google API calls in parallel (external, no process spawning)
        const googleResults = await Promise.allSettled([
            ga4Configured ? fetchGA4Visitors(startDate, endDate) : null,
            scConfigured ? fetchKeywordPositions(startDate, endDate) : null,
            scConfigured ? fetchSearchTraffic(startDate, endDate) : null,
            scConfigured ? fetchTopPages(startDate, endDate) : null,
            scConfigured ? fetchDeviceBreakdown(startDate, endDate) : null,
            scConfigured ? fetchCountryBreakdown(startDate, endDate) : null,
            scConfigured ? fetchIndexedPages(startDate, endDate) : null,
        ])

        const [ga4, keywords, searchTraffic, scTopPages, devices, countries, indexedPaths] =
            googleResults.map(r => r.status === 'fulfilled' ? r.value : null)

        // Run Prisma queries sequentially to avoid EAGAIN on shared hosting
        let allPages = []
        let indexingLogs = []
        try {
            allPages = await prisma.pageStat.findMany({ orderBy: { views: 'desc' } })
            indexingLogs = await prisma.indexingLog.findMany({
                where: { action: { in: ['index', 'recheck', 'inspect'] } },
                orderBy: { date: 'desc' },
            })
        } catch (dbErr) {
            console.error('getGoogleAnalytics DB error:', dbErr.message)
        }

    // Build indexed set from SC data (pages with impressions = visible in Google)
    const scIndexedSet = new Set((indexedPaths || []).map(p => p.replace(/\/$/, '') || '/'))
    const scDataAvailable = indexedPaths !== null && indexedPaths.length > 0

    // Build maps from indexing logs
    const lastPushMap = {}
    const inspectMap = {}
    for (const log of indexingLogs) {
        // Most recent push per slug (index/recheck actions)
        if ((log.action === 'index' || log.action === 'recheck') && !lastPushMap[log.slug]) {
            lastPushMap[log.slug] = { date: log.date, status: log.status, action: log.action }
        }
        // Most recent inspect result per slug
        if (log.action === 'inspect' && !inspectMap[log.slug]) {
            inspectMap[log.slug] = { verdict: log.status, date: log.date }
        }
    }

    // Build full page list from PageStat
    const pages = allPages.map(ps => {
        const path = slugToPath(ps.slug)
        const normalizedPath = path.replace(/\/$/, '') || '/'
        // Determine indexed: inspection API result > SC impressions > optimistic fallback
        const inspection = inspectMap[ps.slug]
        let indexed = false
        if (inspection) {
            // Trust inspect result (most accurate)
            indexed = inspection.verdict === 'PASS'
        } else if (scDataAvailable) {
            // SC data available — use impressions as proxy
            indexed = scIndexedSet.has(normalizedPath)
        } else {
            // No SC data (API failed) — don't mark everything as not-indexed
            // Use last known inspect if available, otherwise assume indexed if page has views
            indexed = ps.views > 0
        }
        const lastPush = lastPushMap[ps.slug] || null
        return {
            slug: ps.slug,
            name: slugToName(ps.slug),
            type: slugToType(ps.slug),
            path,
            views: ps.views,
            likes: ps.likes,
            shares: ps.shares,
            indexed,
            inspected: !!inspection,
            lastPush: lastPush ? {
                date: lastPush.date.toISOString(),
                status: lastPush.status,
                action: lastPush.action,
            } : null,
        }
    })

    return {
        ga4,
        keywords,
        searchTraffic,
        topPages: scTopPages,
        devices,
        countries,
        indexedPaths,
        pages,
        googleConfigured: { ga4: ga4Configured, sc: scConfigured },
    }
    } catch (err) {
        console.error('getGoogleAnalytics fatal error:', err.message)
        return {
            ga4: null,
            keywords: null,
            searchTraffic: null,
            topPages: null,
            devices: null,
            countries: null,
            indexedPaths: null,
            pages: [],
            googleConfigured: { ga4: false, sc: false },
        }
    }
}
