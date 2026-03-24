'use client'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Progress from '@/components/ui/Progress'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import Table from '@/components/ui/Table'
import Loading from '@/components/shared/Loading'
import RegionMap from '@/components/shared/RegionMap'
import GrowShrinkValue from '@/components/shared/GrowShrinkValue'
import AbbreviateNumber from '@/components/shared/AbbreviateNumber'
import classNames from '@/utils/classNames'
import useTheme from '@/utils/hooks/useTheme'
import { COLOR_1, COLOR_2, COLOR_4 } from '@/constants/chart.constant'
import { NumericFormat } from 'react-number-format'
import {
    TbCash, TbClock, TbAlertTriangle, TbCheck,
} from 'react-icons/tb'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
} from '@tanstack/react-table'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('@/components/shared/Chart'), {
    ssr: false,
    loading: () => (
        <div className="h-[425px] flex items-center justify-center">
            <Loading loading />
        </div>
    ),
})

const { Tr, Td, TBody, THead, Th } = Table

const chartColors = { paid: COLOR_1, outstanding: COLOR_2, overdue: COLOR_4 }

const overviewOptions = [
    { value: 'month', label: 'Monthly' },
    { value: 'week', label: 'Weekly' },
    { value: 'year', label: 'Annualy' },
]

const targetOptions = [
    { value: 'month', label: 'Monthly' },
    { value: 'week', label: 'Weekly' },
    { value: 'year', label: 'Annualy' },
]

const targetPeriodLabel = { month: 'month', week: 'week', year: 'year' }

const statusColorMap = {
    draft: { dotClass: 'bg-gray-400', textClass: 'text-gray-500', label: 'Draft' },
    sent: { dotClass: 'bg-blue-500', textClass: 'text-blue-500', label: 'Sent' },
    paid: { dotClass: 'bg-emerald-500', textClass: 'text-emerald-500', label: 'Paid' },
    overdue: { dotClass: 'bg-red-500', textClass: 'text-red-500', label: 'Overdue' },
    cancelled: { dotClass: 'bg-gray-300', textClass: 'text-gray-400', label: 'Cancelled' },
}

const countryCodeMap = {
    'Morocco': 'MA', 'France': 'FR', 'United States': 'US', 'USA': 'US',
    'United Kingdom': 'GB', 'UK': 'GB', 'Germany': 'DE', 'Spain': 'ES',
    'Italy': 'IT', 'Belgium': 'BE', 'Netherlands': 'NL', 'Canada': 'CA',
    'Saudi Arabia': 'SA', 'UAE': 'AE', 'Tunisia': 'TN', 'Algeria': 'DZ',
    'Egypt': 'EG', 'Turkey': 'TR', 'Brazil': 'BR', 'India': 'IN',
    'China': 'CN', 'Japan': 'JP', 'Australia': 'AU', 'Portugal': 'PT',
    'Switzerland': 'CH', 'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK',
    'Poland': 'PL', 'Qatar': 'QA', 'Kuwait': 'KW', 'Bahrain': 'BH',
    'Oman': 'OM', 'Jordan': 'JO', 'Lebanon': 'LB', 'Iraq': 'IQ',
    'Libya': 'LY', 'Senegal': 'SN', 'Ivory Coast': 'CI', 'Cameroon': 'CM',
    'Unknown': null,
}
// Code → full country name (DB stores codes like MA, FR, US)
const codeToCountry = {
    MA: 'Morocco', FR: 'France', US: 'United States', GB: 'United Kingdom',
    DE: 'Germany', ES: 'Spain', IT: 'Italy', BE: 'Belgium', NL: 'Netherlands',
    CA: 'Canada', SA: 'Saudi Arabia', AE: 'UAE', TN: 'Tunisia', DZ: 'Algeria',
    EG: 'Egypt', TR: 'Turkey', BR: 'Brazil', IN: 'India', CN: 'China',
    JP: 'Japan', AU: 'Australia', PT: 'Portugal', CH: 'Switzerland',
    SE: 'Sweden', NO: 'Norway', DK: 'Denmark', PL: 'Poland', QA: 'Qatar',
    KW: 'Kuwait', BH: 'Bahrain', OM: 'Oman', JO: 'Jordan', LB: 'Lebanon',
    IQ: 'Iraq', LY: 'Libya', SN: 'Senegal', CI: 'Ivory Coast', CM: 'Cameroon',
}

const StatisticCard = ({ title, value, icon, iconClass, active, label, onClick, growShrink, compareFrom }) => (
    <button
        className={classNames(
            'p-4 rounded-2xl cursor-pointer ltr:text-left rtl:text-right transition duration-150 outline-hidden',
            active && 'bg-white dark:bg-gray-900 shadow-md',
        )}
        onClick={() => onClick?.(label)}
    >
        <div className="flex md:flex-col-reverse gap-2 2xl:flex-row justify-between relative">
            <div>
                <div className="mb-4 text-sm font-semibold">{title}</div>
                <h3 className="mb-1">{value}</h3>
                <div className="inline-flex items-center flex-wrap gap-1">
                    <GrowShrinkValue
                        className="font-bold"
                        value={growShrink}
                        suffix="%"
                        positiveIcon="+"
                        negativeIcon=""
                    />
                    <span>{compareFrom}</span>
                </div>
            </div>
            <div className={classNames(
                'flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 text-gray-900 rounded-full text-2xl',
                iconClass,
            )}>
                {icon}
            </div>
        </div>
    </button>
)

const InvoiceColumn = ({ row }) => {
    const router = useRouter()
    const handleView = useCallback(() => {
        router.push(`/concepts/invoices/invoice-detail/${row.id}`)
    }, [row.id, router])
    return (
        <span className="cursor-pointer select-none font-semibold hover:text-primary" onClick={handleView}>
            {row.number || `#${row.id.slice(-6)}`}
        </span>
    )
}

const RecentInvoices = ({ data = [] }) => {
    const router = useRouter()
    const columns = useMemo(() => [
        {
            accessorKey: 'number',
            header: 'Invoice',
            cell: (props) => <InvoiceColumn row={props.row.original} />,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: (props) => {
                const s = statusColorMap[props.row.original.status] || statusColorMap.draft
                return (
                    <div className="flex items-center">
                        <Badge className={s.dotClass} />
                        <span className={`ml-2 rtl:mr-2 capitalize font-semibold ${s.textClass}`}>{s.label}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: 'customer',
            header: 'Client',
            cell: (props) => {
                const c = props.row.original.customer
                return <span>{c ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : '-'}</span>
            },
        },
        {
            accessorKey: 'dueDate',
            header: 'Due Date',
            cell: (props) => <span>{props.row.original.dueDate ? new Date(props.row.original.dueDate).toLocaleDateString('en') : '-'}</span>,
        },
        {
            accessorKey: 'total',
            header: 'Amount',
            cell: (props) => (
                <NumericFormat
                    className="heading-text font-bold"
                    displayType="text"
                    value={(props.row.original.total || 0).toFixed(2)}
                    suffix={' MAD'}
                    thousandSeparator={true}
                />
            ),
        },
    ], [])

    const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

    return (
        <Card>
            <div className="flex items-center justify-between mb-6">
                <h4>Recent Invoices</h4>
                <Button size="sm" onClick={() => router.push('/concepts/invoices/invoice-list')}>View All</Button>
            </div>
            <Table>
                <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <Th key={header.id} colSpan={header.colSpan}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </Th>
                            ))}
                        </Tr>
                    ))}
                </THead>
                <TBody>
                    {table.getRowModel().rows.map((row) => (
                        <Tr key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <Td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </Td>
                            ))}
                        </Tr>
                    ))}
                </TBody>
            </Table>
        </Card>
    )
}

const Bar = ({ percent, className }) => (
    <div className="flex-1" style={{ width: `${percent}%` }}>
        <div className={classNames('h-1.5 rounded-full', className)} />
        <div className="font-bold heading-text mt-1">{percent}%</div>
    </div>
)

const TopCountries = ({ data = [] }) => {
    const [hovering, setHovering] = useState('')
    return (
        <Card>
            <h4>Top Countries</h4>
            <div className="flex flex-col xl:flex-row items-center gap-4 mt-4">
                <div className="px-4 flex flex-col justify-center flex-1 w-full">
                    <RegionMap data={data.map(d => ({ ...d, name: codeToCountry[d.name] || d.name }))} valueSuffix="%" hoverable={false} />
                </div>
                <div className="flex flex-col justify-center px-4 2xl:min-w-[340px] xl:w-[300px] w-full">
                    {data.map((item) => {
                        const code = item.name
                        const displayName = codeToCountry[code] || code
                        return (
                            <div
                                key={item.name}
                                className={classNames(
                                    'flex items-center gap-4 p-3 rounded-xl transition-colors duration-150',
                                    hovering === item.name && 'bg-gray-100 dark:bg-gray-700',
                                )}
                                onMouseEnter={() => setHovering(item.name)}
                                onMouseLeave={() => setHovering('')}
                            >
                                <div className="flex gap-2">
                                    {code && code !== 'Unknown' ? (
                                        <Avatar src={`/img/countries/${code}.png`} size={30} />
                                    ) : (
                                        <Avatar size={30}>{(displayName || '?')[0]}</Avatar>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="heading-text font-semibold">{displayName}</div>
                                        <div className="text-xs">{item.count} inv.</div>
                                    </div>
                                    <Progress
                                        percent={item.value}
                                        trailClass={classNames(
                                            'transition-colors duration-150',
                                            hovering === item.name && 'bg-gray-200 dark:bg-gray-600',
                                        )}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </Card>
    )
}

export default function Page() {
    const [stats, setStats] = useState(null)
    const [recentInvoices, setRecentInvoices] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState('paid')
    const [selectedPeriod, setSelectedPeriod] = useState('month')
    const [targetPeriod, setTargetPeriod] = useState('month')
    const sideNavCollapse = useTheme((state) => state.layout.sideNavCollapse)
    const isFirstRender = useRef(true)

    const fetchData = useCallback((period) => {
        setLoading(true)
        const qs = period ? `?period=${period}` : ''
        const recentQs = period ? `&period=${period}` : ''
        Promise.all([
            fetch(`/api/invoices/stats${qs}`).then(r => r.json()),
            fetch(`/api/invoices?pageSize=8&sortKey=createdAt&order=desc${recentQs}`).then(r => r.json()),
        ])
            .then(([statsData, invoicesData]) => {
                setStats(statsData)
                setRecentInvoices(invoicesData.list || [])
            })
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => { fetchData(selectedPeriod) }, [selectedPeriod, fetchData])

    useEffect(() => {
        if (!sideNavCollapse && isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        if (!isFirstRender.current && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('resize'))
        }
    }, [sideNavCollapse])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loading loading />
            </div>
        )
    }

    if (!stats) return null

    const totalAll = (stats.totalReceived || 0) + (stats.totalOutstanding || 0) + (stats.totalOverdue || 0)
    const paidPercent = totalAll > 0 ? Math.round((stats.totalReceived / totalAll) * 100) : 0
    const outstandingPercent = totalAll > 0 ? Math.round((stats.totalOutstanding / totalAll) * 100) : 0
    const overduePercent = totalAll > 0 ? Math.round((stats.totalOverdue / totalAll) * 100) : 0

    const comparePeriod = selectedPeriod === 'week' ? 'from last week' : selectedPeriod === 'year' ? 'from last year' : 'from last month'

    const chartSeries = stats.chart?.[selectedCategory]
        ? [{ name: stats.chart[selectedCategory].name, data: stats.chart[selectedCategory].data }]
        : []

    return (
        <div className="flex flex-col gap-4 max-w-full overflow-x-hidden">
            <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex flex-col gap-4 flex-1 xl:col-span-3">
                    <Card>
                        <div className="flex items-center justify-between">
                            <h4>Overview</h4>
                            <Select
                                instanceId="invoice-period"
                                className="w-[120px]"
                                size="sm"
                                placeholder="Select period"
                                value={overviewOptions.find(o => o.value === selectedPeriod)}
                                options={overviewOptions}
                                isSearchable={false}
                                onChange={(o) => { if (o) setSelectedPeriod(o.value) }}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-2xl p-3 bg-gray-100 dark:bg-gray-700 mt-4">
                            <StatisticCard
                                title="Outstanding"
                                value={<><AbbreviateNumber value={stats.totalOutstanding || 0} /> <span className="text-sm font-normal">MAD</span></>}
                                iconClass="bg-sky-200"
                                icon={<TbClock />}
                                label="outstanding"
                                active={selectedCategory === 'outstanding'}
                                onClick={setSelectedCategory}
                                growShrink={stats.comparison?.outstanding ?? 0}
                                compareFrom={comparePeriod}
                            />
                            <StatisticCard
                                title="Overdue"
                                value={<><AbbreviateNumber value={stats.totalOverdue || 0} /> <span className="text-sm font-normal">MAD</span></>}
                                iconClass="bg-red-200"
                                icon={<TbAlertTriangle />}
                                label="overdue"
                                active={selectedCategory === 'overdue'}
                                onClick={setSelectedCategory}
                                growShrink={stats.comparison?.overdue ?? 0}
                                compareFrom={comparePeriod}
                            />
                            <StatisticCard
                                title="Paid"
                                value={<><AbbreviateNumber value={stats.totalReceived || 0} /> <span className="text-sm font-normal">MAD</span></>}
                                iconClass="bg-emerald-200"
                                icon={<TbCash />}
                                label="paid"
                                active={selectedCategory === 'paid'}
                                onClick={setSelectedCategory}
                                growShrink={stats.comparison?.received ?? 0}
                                compareFrom={comparePeriod}
                            />
                        </div>
                        <div className="min-h-[425px]">
                            <Chart
                                type="line"
                                series={chartSeries}
                                xAxis={stats.chart?.months || []}
                                height="410px"
                                customOptions={{
                                    legend: { show: false },
                                    colors: [chartColors[selectedCategory]],
                                    yaxis: {
                                        labels: {
                                            formatter: (val) => {
                                                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M'
                                                if (val >= 1000) return (val / 1000).toFixed(1) + 'K'
                                                return Math.round(val).toString()
                                            },
                                        },
                                    },
                                    tooltip: {
                                        y: {
                                            formatter: (val) => {
                                                if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M MAD'
                                                if (val >= 1000) return (val / 1000).toFixed(1) + 'K MAD'
                                                return Math.round(val) + ' MAD'
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </Card>
                    <TopCountries data={stats.topCountries || []} />
                </div>
                <div className="flex flex-col gap-4 2xl:min-w-[360px]">
                    <Card>
                        <div className="flex items-center justify-between mb-4">
                            <h4>Payment Target</h4>
                            <Select
                                instanceId="payment-target-period"
                                className="w-[120px]"
                                size="sm"
                                placeholder="Select period"
                                value={targetOptions.find(o => o.value === targetPeriod)}
                                options={targetOptions}
                                isSearchable={false}
                                onChange={(o) => { if (o) setTargetPeriod(o.value) }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-8">
                            <div className="flex flex-col">
                                <h2>
                                    <AbbreviateNumber value={stats.totalReceived || 0} />
                                    <span className="opacity-60 text-base font-bold">
                                        {' / '}<AbbreviateNumber value={totalAll || 0} /> MAD
                                    </span>
                                </h2>
                                <div className="mt-1">Collected this {targetPeriodLabel[targetPeriod]} year</div>
                            </div>
                            <div>
                                <Progress percent={paidPercent} width={80} variant="circle" strokeWidth={8} />
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <h4>Summary</h4>
                        <div className="mt-5">
                            {[
                                { label: 'Paid', count: stats.paidCount, amount: stats.totalReceived, icon: <TbCheck />, bg: 'bg-emerald-200', change: stats.comparison?.received },
                                { label: 'Outstanding', count: stats.unpaidCount, amount: stats.totalOutstanding, icon: <TbClock />, bg: 'bg-sky-200', change: stats.comparison?.outstanding },
                                { label: 'Overdue', count: stats.overdueCount, amount: stats.totalOverdue, icon: <TbAlertTriangle />, bg: 'bg-red-200', change: stats.comparison?.overdue },
                            ].map((row, i) => (
                                <div key={i} className={classNames('flex items-center justify-between py-2', i < 2 && 'mb-2')}>
                                    <div className="flex items-center gap-2">
                                        <div className={classNames('flex items-center justify-center min-h-12 min-w-12 max-h-12 max-w-12 text-gray-900 rounded-full text-2xl', row.bg)}>
                                            {row.icon}
                                        </div>
                                        <div>
                                            <div className="heading-text font-bold">{row.label}</div>
                                            <div>{row.count || 0} invoices</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold heading-text"><AbbreviateNumber value={row.amount || 0} /> MAD</div>
                                        {row.change !== null && row.change !== undefined && (
                                            <GrowShrinkValue
                                                className="font-bold text-xs justify-end"
                                                value={row.change}
                                                suffix="%"
                                                positiveIcon="+"
                                                negativeIcon=""
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                    <Card>
                        <h4 className="mb-4">Amounts</h4>
                        <div className="mt-8">
                            <div className="flex items-center gap-3">
                                <h2>{stats.totalInvoices || 0}</h2>
                                <div className="font-nor leading-5"><div>Total</div><div>Invoices</div></div>
                                {stats.comparison?.invoices !== null && stats.comparison?.invoices !== undefined && (
                                    <GrowShrinkValue
                                        className="font-bold text-xs ml-2 px-2 py-0.5 rounded-full"
                                        value={stats.comparison.invoices}
                                        suffix="%"
                                        positiveIcon="+"
                                        negativeIcon=""
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-6">
                            <Bar percent={paidPercent} className="bg-emerald-200 dark:opacity-70" />
                            <Bar percent={outstandingPercent} className="bg-sky-200 dark:opacity-70" />
                            <Bar percent={overduePercent} className="bg-red-200 dark:opacity-70" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-4 mt-8">
                            <div className="grid grid-cols-3">
                                {[
                                    { icon: <TbCash />, bg: 'bg-emerald-200', amount: stats.totalReceived, label: 'Paid' },
                                    { icon: <TbClock />, bg: 'bg-sky-200', amount: stats.totalOutstanding, label: 'Outstanding' },
                                    { icon: <TbAlertTriangle />, bg: 'bg-red-200', amount: stats.totalOverdue, label: 'Overdue' },
                                ].map((col, i) => (
                                    <div key={i} className="flex flex-col items-center gap-5">
                                        <div className={classNames('rounded-full flex items-center justify-center h-12 w-12 text-xl text-gray-900', col.bg)}>{col.icon}</div>
                                        <div className="text-center">
                                            <h6 className="font-bold mb-1"><AbbreviateNumber value={col.amount || 0} /></h6>
                                            <div className="text-center text-xs">{col.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
            <RecentInvoices data={recentInvoices} />
        </div>
    )
}
