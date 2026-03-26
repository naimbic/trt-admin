'use client'
import TabRedirects from '../analytic/_components/TabRedirects'

const Page = () => {
    return (
        <div className="flex flex-col gap-4">
            <h4>Redirects & 404 Errors</h4>
            <TabRedirects />
        </div>
    )
}

export default Page
