'use client'
import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Input from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import { NumericFormat } from 'react-number-format'
import { TbSearch, TbEye, TbHeart, TbShare, TbRobot, TbArrowUp, TbArrowDown } from 'react-icons/tb'
import getPageStats from '@/server/actions/getPageStats'

const { Tr, Th, Td, THead, TBody } = Table

const PAGE_SIZE = 10

const sortableColumns = [
    { key: 'slug', label: 'Page', icon: null },
    { key: 'views', label: 'Views', icon: <TbEye size={14} /> },
    { key: 'likes', label: 'Likes', icon: <TbHeart size={14} /> },
    { key: 'shares', label: 'Shares', icon: <TbShare size={14} /> },
]

const PageStats = () => {
    const [data, setData] = useState({ list: [], total: 0 })
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState('')
    const [sortKey, setSortKey] = useState('views')
    const [order, setOrder] = useState('desc')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const result = await getPageStats({
                pageIndex: String(page),
                pageSize: String(PAGE_SIZE),
                sortKey,
                order,
                query: search || undefined,
            })
            setData(result)
        } catch {
            setData({ list: [], total: 0 })
        }
        setLoading(false)
    }, [page, sortKey, order, search])

    useEffect(() => { fetchData() }, [fetchData])

    const handleSort = (key) => {
        if (sortKey === key) {
            setOrder(o => o === 'desc' ? 'asc' : 'desc')
        } else {
            setSortKey(key)
            setOrder('desc')
        }
        setPage(1)
    }

    const handleSearch = (e) => {
        setSearch(e.target.value)
        setPage(1)
    }

    // Sum all values in aiClicks object
    const getAiTotal = (row) => {
        if (!row.aiClicks || typeof row.aiClicks !== 'object') return 0
        return Object.values(row.aiClicks).reduce((sum, v) => sum + (Number(v) || 0), 0)
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h5>Page Stats</h5>
                <Input
                    prefix={<TbSearch className="text-lg" />}
                    placeholder="Search pages..."
                    value={search}
                    onChange={handleSearch}
                    className="max-w-[240px]"
                    size="sm"
                />
            </div>
            <div className="overflow-auto">
                <Table compact>
                    <THead>
                        <Tr>
                            {sortableColumns.map(col => (
                                <Th
                                    key={col.key}
                                    className="cursor-pointer select-none"
                                    onClick={() => handleSort(col.key)}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.icon}
                                        <span>{col.label}</span>
                                        {sortKey === col.key && (
                                            order === 'desc'
                                                ? <TbArrowDown size={12} />
                                                : <TbArrowUp size={12} />
                                        )}
                                    </div>
                                </Th>
                            ))}
                            <Th>
                                <div className="flex items-center gap-1">
                                    <TbRobot size={14} />
                                    <span>AI</span>
                                </div>
                            </Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {loading ? (
                            <Tr><Td colSpan={5} className="text-center text-gray-400 py-8">Loading...</Td></Tr>
                        ) : data.list.length === 0 ? (
                            <Tr><Td colSpan={5} className="text-center text-gray-400 py-8">No pages found</Td></Tr>
                        ) : (
                            data.list.map(row => (
                                <Tr key={row.id}>
                                    <Td>
                                        <div className="truncate max-w-[300px] text-sm font-medium">
                                            {row.slug}
                                        </div>
                                    </Td>
                                    <Td><NumericFormat displayType="text" value={row.views} thousandSeparator /></Td>
                                    <Td><NumericFormat displayType="text" value={row.likes} thousandSeparator /></Td>
                                    <Td><NumericFormat displayType="text" value={row.shares} thousandSeparator /></Td>
                                    <Td><NumericFormat displayType="text" value={getAiTotal(row)} thousandSeparator /></Td>
                                </Tr>
                            ))
                        )}
                    </TBody>
                </Table>
            </div>
            {data.total > PAGE_SIZE && (
                <div className="flex justify-end mt-4">
                    <Pagination
                        total={data.total}
                        currentPage={page}
                        pageSize={PAGE_SIZE}
                        onChange={(p) => setPage(p)}
                    />
                </div>
            )}
        </Card>
    )
}

export default PageStats
