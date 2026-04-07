import AnalyticDashboard from './_components/AnalyticDashboard'
import getAnalyticDashboard from '@/server/actions/getAnalyticDashboard'
import getGoogleAnalytics from '@/server/actions/getGoogleAnalytics'

export default async function Page() {
    // Sequential to avoid EAGAIN process spawn limits on shared hosting
    const data = await getAnalyticDashboard()
    const googleData = await getGoogleAnalytics()

    return <AnalyticDashboard data={data} googleData={googleData} />
}
