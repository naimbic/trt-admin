'use client'
import { useState, useMemo, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import { NumericFormat } from 'react-number-format'
import Chart from '@/components/shared/Chart'
import { COLOR_1, COLOR_2, COLOR_3 } from '@/constants/chart.constant'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import {
    TbClick, TbEye, TbKey, TbArrowUp,
    TbDeviceDesktop, TbDeviceMobile, TbDeviceTablet,
    TbWorld, TbBrandGoogle, TbSettings,
} from 'react-icons/tb'

const Select = dynamic(() => import('@/components/ui/Select'), { ssr: false })
const { Tr, Th, Td, THead, TBody } = Table

const periodOpts = [
    { value: 'today', label: 'Day' },
    { value: 'thisWeek', label: 'Week' },
    { value: 'thisMonth', label: 'Month' },
    { value: 'all', label: 'Last 90 Days' },
]

const deviceIcons = {
    DESKTOP: <TbDeviceDesktop size={16} />,
    MOBILE: <TbDeviceMobile size={16} />,
    TABLET: <TbDeviceTablet size={16} />,
}

function filterByPeriod(ga4, period) {
    if (!ga4) return null
    const now = dayjs()
    // Build a map of date -> data
    const dataMap = {}
    ga4.forEach(d => { dataMap[d.date] = d })

    if (period === 'all') return ga4

    let start, end, dates = []
    if (period === 'today') {
        // GA4 doesn't have hourly data, just return today's row if exists
        const todayStr = now.format('YYYY-MM-DD')
        return ga4.filter(d => d.date === todayStr)
    } else if (period === 'thisWeek') {
        start = now.startOf('week')
        end = now
    } else if (period === 'thisMonth') {
        start = now.startOf('month')
        end = now
    } else {
        return ga4
    }

    // Generate all dates in range, fill missing with zeros
    let cursor = start
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        const key = cursor.format('YYYY-MM-DD')
        dates.push(dataMap[key] || { date: key, sessions: 0, users: 0, pageviews: 0 })
        cursor = cursor.add(1, 'day')
    }
    return dates
}

const TabGoogle = ({ data }) => {
    const [period, setPeriod] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('google_period') || 'today'
        }
        return 'today'
    })

    useEffect(() => {
        localStorage.setItem('google_period', period)
    }, [period])

    if (!data) return null
    const { ga4, keywords, searchTraffic, topPages, devices, countries, googleConfigured } = data

    // Not configured at all
    if (!googleConfigured?.ga4 && !googleConfigured?.sc) {
        return (
            <Card>
                <div className="text-center py-12 text-gray-400">
                    <div className="flex justify-center mb-4"><TbSettings size={48} /></div>
                    <p className="text-lg mb-2">Google APIs Not Configured</p>
                    <p className="text-sm mb-4">Add these environment variables to .env:</p>
                    <div className="inline-block text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-xs font-mono">
                        <div>GOOGLE_SERVICE_ACCOUNT_EMAIL=&quot;...@...iam.gserviceaccount.com&quot;</div>
                        <div>GOOGLE_PRIVATE_KEY=&quot;-----BEGIN PRIVATE KEY-----\n...&quot;</div>
                        <div>GA4_PROPERTY_ID=&quot;527890274&quot;</div>
                        <div>SEARCH_CONSOLE_SITE_URL=&quot;sc-domain:trtmaroc.com&quot;</div>
                    </div>
                </div>
            </Card>
        )
    }

    const hasAnyData = ga4 || keywords || searchTraffic || topPages || devices || countries

    if (!hasAnyData) {
        return (
            <Card>
                <div className="text-center py-12 text-gray-400">
                    <div className="flex justify-center mb-4"><TbBrandGoogle size={48} /></div>
                    <p className="text-lg mb-2">No Data Available</p>
                    <p className="text-sm">APIs are configured but returned no data. Check service account permissions in GA4 and Search Console.</p>
                </div>
            </Card>
        )
    }

    const filteredGa4 = useMemo(() => filterByPeriod(ga4, period), [ga4, period])

    // Compact x-axis labels based on period
    const formatCategory = (dateStr) => {
        const d = dayjs(dateStr)
        if (period === 'today') return String(d.hour())
        if (period === 'thisWeek') return d.format('dd')
        if (period === 'thisMonth') return String(d.date())
        return d.format('D MMM')
    }

    const ga4Chart = filteredGa4 && filteredGa4.length > 0 ? {
        series: [
            { name: 'Users', data: filteredGa4.map(d => d.users) },
            { name: 'Sessions', data: filteredGa4.map(d => d.sessions) },
            { name: 'Pageviews', data: filteredGa4.map(d => d.pageviews) },
        ],
        categories: filteredGa4.map(d => formatCategory(d.date)),
    } : null

    const periodLabel = period === 'all' ? 'Last 90 Days' : period === 'today' ? 'Today' : period === 'thisWeek' ? 'This Week' : 'This Month'

    // Compute summary from filtered GA4 data
    const ga4Summary = useMemo(() => {
        if (!filteredGa4 || !filteredGa4.length) return null
        return {
            users: filteredGa4.reduce((s, d) => s + d.users, 0),
            sessions: filteredGa4.reduce((s, d) => s + d.sessions, 0),
            pageviews: filteredGa4.reduce((s, d) => s + d.pageviews, 0),
        }
    }, [filteredGa4])

    return (
        <div className="flex flex-col gap-4">
            {/* Header with period filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h4 className="mb-1">Google overview</h4>
                    <p>GA4 visitors and Search Console performance.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span>Show by:</span>
                    <Select
                        instanceId="google-period"
                        className="w-[160px]"
                        size="sm"
                        value={periodOpts.find(o => o.value === period)}
                        options={periodOpts}
                        isSearchable={false}
                        onChange={o => o?.value && setPeriod(o.value)}
                    />
                </div>
            </div>

            {ga4Summary && (
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600"><TbEye size={20} /></div>
                            <div><div className="text-xs text-gray-500">Pageviews</div><h4><NumericFormat displayType="text" value={ga4Summary.pageviews} thousandSeparator /></h4></div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-100 text-cyan-600"><TbClick size={20} /></div>
                            <div><div className="text-xs text-gray-500">Sessions</div><h4><NumericFormat displayType="text" value={ga4Summary.sessions} thousandSeparator /></h4></div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-violet-100 text-violet-600"><TbWorld size={20} /></div>
                            <div><div className="text-xs text-gray-500">Users</div><h4><NumericFormat displayType="text" value={ga4Summary.users} thousandSeparator /></h4></div>
                        </div>
                    </Card>
                </div>
            )}

            {searchTraffic && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600"><TbClick size={20} /></div>
                            <div><div className="text-xs text-gray-500">Clicks</div><h4><NumericFormat displayType="text" value={searchTraffic.clicks} thousandSeparator /></h4></div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600"><TbEye size={20} /></div>
                            <div><div className="text-xs text-gray-500">Impressions</div><h4><NumericFormat displayType="text" value={searchTraffic.impressions} thousandSeparator /></h4></div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600"><TbKey size={20} /></div>
                            <div><div className="text-xs text-gray-500">Keywords</div><h4><NumericFormat displayType="text" value={searchTraffic.keywords} thousandSeparator /></h4></div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600"><TbArrowUp size={20} /></div>
                            <div><div className="text-xs text-gray-500">Avg Position</div><h4>{searchTraffic.avgPosition}</h4></div>
                        </div>
                    </Card>
                </div>
            )}

            {ga4Chart && (
                <Card>
                    <h5 className="mb-4">GA4 Visitors ({periodLabel})</h5>
                    <Chart type="area" series={ga4Chart.series} xAxis={ga4Chart.categories} height={300}
                        customOptions={{ colors: [COLOR_1, COLOR_2, COLOR_3], xaxis: { labels: { show: true, rotate: -45, rotateAlways: false } }, stroke: { width: 2, curve: 'smooth' }, fill: { type: 'gradient', gradient: { opacityFrom: 0.3, opacityTo: 0 } } }}
                    />
                </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {keywords && keywords.length > 0 && (
                    <Card>
                        <h5 className="mb-4">Top Keywords</h5>
                        <div className="overflow-auto max-h-[400px]">
                            <Table>
                                <THead><Tr><Th>Keyword</Th><Th>Clicks</Th><Th>Impr.</Th><Th>CTR</Th><Th>Pos.</Th></Tr></THead>
                                <TBody>
                                    {keywords.map((kw, i) => (
                                        <Tr key={i}>
                                            <Td className="max-w-[200px] truncate">{kw.keyword}</Td>
                                            <Td>{kw.clicks}</Td>
                                            <Td><NumericFormat displayType="text" value={kw.impressions} thousandSeparator /></Td>
                                            <Td>{kw.ctr}%</Td>
                                            <Td><Badge className={kw.position <= 10 ? 'bg-emerald-100 text-emerald-600' : kw.position <= 20 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}>{kw.position}</Badge></Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    </Card>
                )}
                {topPages && topPages.length > 0 && (
                    <Card>
                        <h5 className="mb-4">Top Pages</h5>
                        <div className="overflow-auto max-h-[400px]">
                            <Table>
                                <THead><Tr><Th>Page</Th><Th>Clicks</Th><Th>Impr.</Th><Th>CTR</Th><Th>Pos.</Th></Tr></THead>
                                <TBody>
                                    {topPages.map((p, i) => (
                                        <Tr key={i}>
                                            <Td className="max-w-[200px] truncate">{p.page}</Td>
                                            <Td>{p.clicks}</Td>
                                            <Td><NumericFormat displayType="text" value={p.impressions} thousandSeparator /></Td>
                                            <Td>{p.ctr}%</Td>
                                            <Td>{p.position}</Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {devices && devices.length > 0 && (
                    <Card>
                        <h5 className="mb-4">Devices</h5>
                        <div className="flex flex-col gap-3">
                            {devices.map((d, i) => {
                                const total = devices.reduce((s, x) => s + x.clicks, 0) || 1
                                const pct = Math.round((d.clicks / total) * 100)
                                return (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="text-gray-500">{deviceIcons[d.device] || <TbWorld size={16} />}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{d.device}</span>
                                                <span className="text-gray-500">{pct}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                                <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: [COLOR_1, COLOR_2, COLOR_3][i] || COLOR_1 }} />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </Card>
                )}
                {countries && countries.length > 0 && (
                    <Card>
                        <h5 className="mb-4">Top Countries</h5>
                        <div className="overflow-auto">
                            <Table>
                                <THead><Tr><Th>Country</Th><Th>Clicks</Th><Th>Impr.</Th><Th>CTR</Th><Th>Pos.</Th></Tr></THead>
                                <TBody>
                                    {countries.map((c, i) => (
                                        <Tr key={i}>
                                            <Td>
                                                <div className="flex items-center gap-2">
                                                    <img src={`/img/countries/${c.country.toUpperCase()}.png`} alt="" className="w-5 h-4 object-cover rounded-sm" onError={e => { e.target.style.display = 'none' }} />
                                                    <span className="uppercase">{c.country}</span>
                                                </div>
                                            </Td>
                                            <Td>{c.clicks}</Td>
                                            <Td><NumericFormat displayType="text" value={c.impressions} thousandSeparator /></Td>
                                            <Td>{c.ctr}%</Td>
                                            <Td>{c.position}</Td>
                                        </Tr>
                                    ))}
                                </TBody>
                            </Table>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default TabGoogle
