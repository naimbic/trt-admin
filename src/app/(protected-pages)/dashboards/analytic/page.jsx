import AnalyticDashboard from './_components/AnalyticDashboard'
import getAnalyticDashboard from '@/server/actions/getAnalyticDashboard'
import getGoogleAnalytics from '@/server/actions/getGoogleAnalytics'

export default async function Page() {
    const [data, googleData] = await Promise.all([
        getAnalyticDashboard(),
        getGoogleAnalytics(),
    ])

    return <AnalyticDashboard data={data} googleData={googleData} />
}
