'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Tabs from '@/components/ui/Tabs'
import Metrics from './Metrics'
import WebAnalytic from './AnalyticChart'
import Traffic from './Traffic'
import TopChannel from './TopChannel'
import DeviceSession from './DeviceSession'
import TopPerformingPages from './TopPerformingPages'
import TabGoogle from './TabGoogle'
import TabIndexing from './TabIndexing'
import PageStats from './PageStats'
import { TbChartBar, TbBrandGoogle, TbWorldSearch } from 'react-icons/tb'

const AnalyticHeader = dynamic(() => import('./AnalyticHeader'), { ssr: false })

const { TabNav, TabList, TabContent } = Tabs

const AnalyticDashboard = ({ data, googleData }) => {
    const [selectedPeriod, setSelectedPeriod] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('analytics_period') || 'today'
        }
        return 'today'
    })
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('analytics_tab') || 'analytics'
        }
        return 'analytics'
    })

    useEffect(() => {
        localStorage.setItem('analytics_period', selectedPeriod)
    }, [selectedPeriod])

    useEffect(() => {
        localStorage.setItem('analytics_tab', activeTab)
    }, [activeTab])

    return (
        <div className="flex flex-col gap-4">
            <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
                <TabList>
                    <TabNav value="analytics" icon={<TbChartBar />}>Analytics</TabNav>
                    <TabNav value="google" icon={<TbBrandGoogle />}>Google</TabNav>
                    <TabNav value="indexing" icon={<TbWorldSearch />}>Indexing</TabNav>
                </TabList>
                <div className="mt-4">
                    <TabContent value="analytics">
                        <div className="flex flex-col gap-4">
                            <AnalyticHeader
                                selectedPeriod={selectedPeriod}
                                onSelectedPeriodChange={setSelectedPeriod}
                            />
                            <div className="flex flex-col 2xl:grid grid-cols-4 gap-4">
                                <div className="col-span-4 2xl:col-span-3">
                                    <WebAnalytic data={data[selectedPeriod].webAnalytic} />
                                </div>
                                <div className="2xl:col-span-1">
                                    <Metrics
                                        data={data[selectedPeriod].metrics}
                                        selectedPeriod={selectedPeriod}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-12 md:col-span-6 xl:col-span-4">
                                    <TopPerformingPages data={data[selectedPeriod].topPages} />
                                </div>
                                <div className="col-span-12 md:col-span-6 xl:col-span-4">
                                    <DeviceSession data={data[selectedPeriod].deviceSession} />
                                </div>
                                <div className="col-span-12 xl:col-span-4">
                                    <TopChannel data={data[selectedPeriod].topChannel} />
                                </div>
                                <div className="col-span-12">
                                    <PageStats />
                                </div>
                                <div className="col-span-12">
                                    <Traffic data={data[selectedPeriod].traffic} />
                                </div>
                            </div>
                        </div>
                    </TabContent>
                    <TabContent value="google">
                        <TabGoogle data={googleData} />
                    </TabContent>
                    <TabContent value="indexing">
                        <TabIndexing data={googleData} />
                    </TabContent>
                </div>
            </Tabs>
        </div>
    )
}

export default AnalyticDashboard
