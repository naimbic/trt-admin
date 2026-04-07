import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isGA4Configured, isSCConfigured, fetchGA4Visitors } from '@/lib/google-apis'
import dayjs from 'dayjs'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.authority?.includes('admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
        const keyLen = process.env.GOOGLE_PRIVATE_KEY?.length || 0
        const keyStart = process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30) || 'MISSING'
        const ga4Id = process.env.GA4_PROPERTY_ID || 'MISSING'
        const scUrl = process.env.SEARCH_CONSOLE_SITE_URL || 'MISSING'

        const config = {
            email: email ? `${email.substring(0, 10)}...` : 'MISSING',
            keyLength: keyLen,
            keyStartsWith: keyStart,
            keyHasNewlines: process.env.GOOGLE_PRIVATE_KEY?.includes('\n') || false,
            keyHasLiteralBackslashN: process.env.GOOGLE_PRIVATE_KEY?.includes('\\n') || false,
            ga4PropertyId: ga4Id,
            searchConsoleSiteUrl: scUrl,
            ga4Configured: isGA4Configured(),
            scConfigured: isSCConfigured(),
        }

        // Try a real GA4 call
        let ga4Test = null
        let ga4Error = null
        try {
            const startDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
            const endDate = dayjs().format('YYYY-MM-DD')
            ga4Test = await fetchGA4Visitors(startDate, endDate)
        } catch (e) {
            ga4Error = { message: e.message, code: e.code, status: e.status }
        }

        return NextResponse.json({
            data: {
                config,
                ga4Test: ga4Test ? `${ga4Test.length} rows` : null,
                ga4Error,
            },
            error: null,
        })
    } catch (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    }
}
