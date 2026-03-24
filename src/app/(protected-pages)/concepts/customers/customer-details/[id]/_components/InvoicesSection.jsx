'use client'
import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Tag from '@/components/ui/Tag'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Loading from '@/components/shared/Loading'
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    createColumnHelper,
} from '@tanstack/react-table'
import { NumericFormat } from 'react-number-format'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { TbEye, TbFileInvoice } from 'react-icons/tb'

const { Tr, Th, Td, THead, TBody } = Table

const statusColor = {
    paid: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
    sent: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    draft: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400' },
    overdue: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
    cancelled: { bg: 'bg-gray-100 dark:bg-gray-500/20', text: 'text-gray-400 dark:text-gray-500' },
}

const columnHelper = createColumnHelper()

const fetcher = async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
}

const InvoicesSection = ({ customerId, currency = 'MAD' }) => {
    const router = useRouter()

    const { data, isLoading } = useSWR(
        customerId ? `/api/invoices?customerId=${customerId}` : null,
        fetcher,
        { revalidateOnFocus: false }
    )

    const invoices = useMemo(() => {
        if (!data) return []
        const list = Array.isArray(data) ? data : data.list || []
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }, [data])

    const displayCurrency = useMemo(() => {
        if (invoices.length > 0) {
            const first = invoices.find(i => i.currency)
            return first?.currency || currency
        }
        return currency
    }, [invoices, currency])

    const summary = useMemo(() => {
        const paid = invoices.filter(i => i.status === 'paid')
        const unpaid = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
        return {
            totalPaid: paid.reduce((s, i) => s + (i.total || 0), 0),
            totalUnpaid: unpaid.reduce((s, i) => s + (i.total || 0), 0),
            paidCount: paid.length,
            unpaidCount: unpaid.length,
        }
    }, [invoices])

    const columns = useMemo(() => [
        columnHelper.accessor('number', {
            header: 'Invoice #',
            cell: (props) => (
                <span className="font-semibold heading-text">{props.getValue()}</span>
            ),
        }),
        columnHelper.accessor('type', {
            header: 'Type',
            cell: (props) => (
                <Tag className="capitalize bg-gray-100 dark:bg-gray-700 border-0">
                    {props.getValue() === 'devis' ? 'Quote' : 'Invoice'}
                </Tag>
            ),
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: (props) => {
                const status = props.getValue()
                const color = statusColor[status] || statusColor.draft
                return (
                    <Tag className={`${color.bg} ${color.text} border-0 capitalize`}>
                        {status}
                    </Tag>
                )
            },
        }),
        columnHelper.accessor('total', {
            header: 'Amount',
            cell: (props) => {
                const row = props.row.original
                return (
                    <NumericFormat
                        displayType="text"
                        value={(row.total || 0).toFixed(2)}
                        suffix={` ${row.currency || 'MAD'}`}
                        thousandSeparator=","
                        className="font-semibold"
                    />
                )
            },
        }),
        columnHelper.accessor('paymentMethod', {
            header: 'Payment',
            cell: (props) => {
                const row = props.row.original
                if (row.status !== 'paid') return <span className="text-gray-400">—</span>
                return (
                    <span className="capitalize text-sm">
                        {(row.paymentMethod || '').replace('_', ' ') || 'N/A'}
                    </span>
                )
            },
        }),
        columnHelper.accessor('createdAt', {
            header: 'Date',
            cell: (props) => dayjs(props.getValue()).format('DD MMM YYYY'),
        }),
        columnHelper.accessor('dueDate', {
            header: 'Due Date',
            cell: (props) => {
                const val = props.getValue()
                return val ? dayjs(val).format('DD MMM YYYY') : '—'
            },
        }),
        columnHelper.display({
            id: 'action',
            cell: (props) => (
                <Button
                    size="xs"
                    variant="plain"
                    icon={<TbEye />}
                    onClick={() => router.push(`/concepts/invoices/invoice-detail/${props.row.original.id}`)}
                />
            ),
        }),
    ], [router])

    const table = useReactTable({
        data: invoices,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    })

    return (
        <Loading loading={isLoading}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card bodyClass="py-3 px-4">
                    <div className="text-sm text-gray-500">Total Invoices</div>
                    <div className="text-xl font-bold heading-text">{invoices.length}</div>
                </Card>
                <Card bodyClass="py-3 px-4">
                    <div className="text-sm text-gray-500">Paid</div>
                    <div className="text-xl font-bold text-emerald-500">{summary.paidCount}</div>
                    <div className="text-xs text-gray-400">{summary.totalPaid.toFixed(2)} {displayCurrency}</div>
                </Card>
                <Card bodyClass="py-3 px-4">
                    <div className="text-sm text-gray-500">Unpaid</div>
                    <div className="text-xl font-bold text-red-500">{summary.unpaidCount}</div>
                    <div className="text-xs text-gray-400">{summary.totalUnpaid.toFixed(2)} {displayCurrency}</div>
                </Card>
                <Card bodyClass="py-3 px-4">
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="text-xl font-bold heading-text">
                        <NumericFormat
                            displayType="text"
                            value={(summary.totalPaid + summary.totalUnpaid).toFixed(2)}
                            suffix={` ${displayCurrency}`}
                            thousandSeparator=","
                        />
                    </div>
                </Card>
            </div>

            {invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <TbFileInvoice className="text-5xl mb-3" />
                    <p className="font-semibold">No invoices found for this customer</p>
                </div>
            ) : (
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
            )}
        </Loading>
    )
}

export default InvoicesSection
