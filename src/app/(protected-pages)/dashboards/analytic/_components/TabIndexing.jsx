'use client'
import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Tooltip from '@/components/ui/Tooltip'
import Pagination from '@/components/ui/Pagination'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { NumericFormat } from 'react-number-format'
import dynamic from 'next/dynamic'
import dayjs from 'dayjs'
import {
    TbWorldUpload, TbWorldOff, TbRefresh, TbSearch, TbSend,
    TbFileText, TbArticle, TbBriefcase,
    TbCircleCheck, TbCircleX, TbClock, TbEyeSearch,
} from 'react-icons/tb'

const Select = dynamic(() => import('@/components/ui/Select'), { ssr: false })
const { Tr, Th, Td, THead, TBody } = Table

const COOLDOWN_MS = 2 * 60 * 60 * 1000 // 2 hours

const typeOpts = [
    { value: 'all', label: 'All Types' },
    { value: 'Page', label: 'Pages' },
    { value: 'Blog', label: 'Blog' },
    { value: 'Portfolio', label: 'Portfolio' },
]
const statusOpts = [
    { value: 'all', label: 'All' },
    { value: 'indexed', label: 'Indexed' },
    { value: 'not-indexed', label: 'Not Indexed' },
]
const typeIcon = {
    Page: { icon: <TbFileText size={16} />, cls: 'text-blue-500' },
    Blog: { icon: <TbArticle size={16} />, cls: 'text-purple-500' },
    Portfolio: { icon: <TbBriefcase size={16} />, cls: 'text-amber-500' },
}

// Compact relative time: 1m, 23m, 2h, 3d, 2w, 1mo
function compactTime(dateStr) {
    if (!dateStr) return null
    const diff = dayjs().diff(dayjs(dateStr), 'second')
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w`
    return `${Math.floor(diff / 2592000)}mo`
}

// Check if a page was pushed within the cooldown window
function isOnCooldown(pushTimeLocal, pushFromServer) {
    const t = pushTimeLocal || pushFromServer
    if (!t) return false
    return dayjs().diff(dayjs(t), 'millisecond') < COOLDOWN_MS
}

const TabIndexing = ({ data }) => {
    const [loading, setLoading] = useState({})
    const [bulkLoading, setBulkLoading] = useState(false)
    const [bulkProgress, setBulkProgress] = useState('')
    const [customUrl, setCustomUrl] = useState('')
    const [customLoading, setCustomLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [pushTimes, setPushTimes] = useState({})
    const [selected, setSelected] = useState(new Set())
    const [indexedOverrides, setIndexedOverrides] = useState({})
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 15
    const bulkAbort = useRef(false)

    // Keep bulk running even if component re-renders — use ref for state updates
    const pushTimesRef = useRef(pushTimes)
    useEffect(() => { pushTimesRef.current = pushTimes }, [pushTimes])

    if (!data) return null
    const { pages = [] } = data

    const filtered = useMemo(() => pages.filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.slug.toLowerCase().includes(search.toLowerCase())) return false
        if (typeFilter !== 'all' && p.type !== typeFilter) return false
        const isIndexed = indexedOverrides[p.slug] !== undefined ? indexedOverrides[p.slug] : p.indexed
        if (statusFilter === 'indexed' && !isIndexed) return false
        if (statusFilter === 'not-indexed' && isIndexed) return false
        return true
    }), [pages, search, typeFilter, statusFilter, indexedOverrides])

    // Reset page when filters change
    useEffect(() => { setCurrentPage(1) }, [search, typeFilter, statusFilter])

    const paginatedFiltered = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return filtered.slice(start, start + PAGE_SIZE)
    }, [filtered, currentPage])

    const indexedCount = pages.filter(p => indexedOverrides[p.slug] !== undefined ? indexedOverrides[p.slug] : p.indexed).length

    const toggle = slug => setSelected(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n })
    const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(p => p.slug)))

    const push = async (page, action) => {
        const k = `${page.slug}-${action}`
        setLoading(p => ({ ...p, [k]: true }))
        try {
            const r = await fetch('/api/google/index-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: `https://trtmaroc.com${page.path}`, slug: page.slug, action }) })
            const j = await r.json()
            if (action === 'inspect') {
                const verdict = j.data?.inspection?.verdict
                if (verdict) {
                    setIndexedOverrides(p => ({ ...p, [page.slug]: verdict === 'PASS' }))
                    toast.push(<Notification type="info" title="Inspect">{page.path}: {verdict}</Notification>)
                } else {
                    toast.push(<Notification type="warning" title="Inspect">No result for {page.path}</Notification>)
                }
            } else if (j.data?.success) {
                toast.push(<Notification type="success" title={action}>{page.path}</Notification>)
                setPushTimes(p => ({ ...p, [page.slug]: new Date().toISOString() }))
            } else {
                toast.push(<Notification type="danger" title="Failed">{j.data?.error || j.error}</Notification>)
            }
        } catch { toast.push(<Notification type="danger" title="Error">Failed</Notification>) }
        setLoading(p => ({ ...p, [k]: false }))
    }

    const bulkIndex = useCallback(async () => {
        if (!selected.size) return
        bulkAbort.current = false
        setBulkLoading(true)
        const targets = pages.filter(p => selected.has(p.slug))
        let ok = 0, fail = 0
        for (let i = 0; i < targets.length; i++) {
            if (bulkAbort.current) break
            const p = targets[i]
            setBulkProgress(`${i + 1}/${targets.length}`)
            try {
                const r = await fetch('/api/google/index-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: `https://trtmaroc.com${p.path}`, slug: p.slug, action: 'index' }) })
                const j = await r.json()
                if (j.data?.success) { ok++; setPushTimes(prev => ({ ...prev, [p.slug]: new Date().toISOString() })) } else fail++
            } catch { fail++ }
        }
        toast.push(<Notification type={fail ? 'warning' : 'success'} title="Bulk Index">{ok} sent, {fail} failed{bulkAbort.current ? ' (cancelled)' : ''}</Notification>)
        setSelected(new Set()); setBulkLoading(false); setBulkProgress('')
    }, [selected, pages])

    const customIndex = async () => {
        if (!customUrl) return
        setCustomLoading(true)
        const url = customUrl.startsWith('http') ? customUrl : `https://trtmaroc.com${customUrl}`
        try {
            const r = await fetch('/api/google/index-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, slug: 'custom', action: 'index' }) })
            const j = await r.json()
            if (j.data?.success) { toast.push(<Notification type="success" title="Sent">{url}</Notification>); setCustomUrl('') }
            else toast.push(<Notification type="danger" title="Failed">{j.data?.error || j.error}</Notification>)
        } catch { toast.push(<Notification type="danger" title="Error">Failed</Notification>) }
        setCustomLoading(false)
    }

    const getLastPushTime = p => pushTimes[p.slug] || p.lastPush?.date
    const getCooldown = p => isOnCooldown(pushTimes[p.slug], p.lastPush?.date)
    const isPageIndexed = p => indexedOverrides[p.slug] !== undefined ? indexedOverrides[p.slug] : p.indexed

    return (
        <div className="flex flex-col gap-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600"><TbFileText size={20} /></div>
                        <div><div className="text-xs text-gray-500">Total</div><h4>{pages.length}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600"><TbCircleCheck size={20} /></div>
                        <div><div className="text-xs text-gray-500">Indexed</div><h4 className="text-emerald-600">{indexedCount}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600"><TbCircleX size={20} /></div>
                        <div><div className="text-xs text-gray-500">Not Indexed</div><h4 className="text-red-600">{pages.length - indexedCount}</h4></div>
                    </div>
                </Card>
            </div>

            {/* Custom URL */}
            <Card>
                <div className="flex gap-2">
                    <Input placeholder="URL or /path" value={customUrl} onChange={e => setCustomUrl(e.target.value)} className="flex-1" size="sm" />
                    <Button size="sm" variant="solid" loading={customLoading} onClick={customIndex} icon={<TbWorldUpload />}>Index</Button>
                </div>
            </Card>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                    <Input prefix={<TbSearch className="text-lg" />} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" size="sm" />
                    <Select size="sm" className="min-w-[130px]" options={typeOpts} value={typeOpts.find(o => o.value === typeFilter)} onChange={o => setTypeFilter(o.value)} isSearchable={false} />
                    <Select size="sm" className="min-w-[130px]" options={statusOpts} value={statusOpts.find(o => o.value === statusFilter)} onChange={o => setStatusFilter(o.value)} isSearchable={false} />
                    {selected.size > 0 && !bulkLoading && (
                        <Button size="sm" variant="solid" color="emerald" onClick={bulkIndex} icon={<TbSend />}>
                            Index {selected.size}
                        </Button>
                    )}
                    {bulkLoading && (
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="solid" color="emerald" loading>{bulkProgress}</Button>
                            <Button size="sm" variant="plain" className="text-red-500" onClick={() => { bulkAbort.current = true }}>Cancel</Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-auto">
                    <Table compact>
                        <THead>
                            <Tr>
                                <Th className="w-8"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></Th>
                                <Th className="w-8"></Th>
                                <Th>Page</Th>
                                <Th className="w-16">Views</Th>
                                <Th className="w-8"></Th>
                                <Th className="w-16 whitespace-nowrap">Push</Th>
                                <Th className="w-28">Actions</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {paginatedFiltered.map(p => {
                                const ti = typeIcon[p.type] || typeIcon.Page
                                const lp = getLastPushTime(p)
                                const cooldown = getCooldown(p)
                                const indexed = isPageIndexed(p)
                                const indexDisabled = indexed || cooldown
                                return (
                                    <Tr key={p.slug}>
                                        <Td><Checkbox checked={selected.has(p.slug)} onChange={() => toggle(p.slug)} /></Td>
                                        <Td><Tooltip title={p.type}><span className={ti.cls}>{ti.icon}</span></Tooltip></Td>
                                        <Td>
                                            <div className="truncate max-w-[280px] font-medium text-sm">{p.name}</div>
                                            <div className="truncate max-w-[280px] text-xs text-gray-400">{p.path}</div>
                                        </Td>
                                        <Td className="text-sm"><NumericFormat displayType="text" value={p.views} thousandSeparator /></Td>
                                        <Td>
                                            <Tooltip title={indexed ? 'Indexed' : 'Not Indexed'}>
                                                {indexed
                                                    ? <TbCircleCheck size={18} className="text-emerald-500" />
                                                    : <TbCircleX size={18} className="text-red-400" />
                                                }
                                            </Tooltip>
                                        </Td>
                                        <Td>
                                            {lp ? (
                                                <Tooltip title={dayjs(lp).format('DD/MM/YYYY HH:mm')}>
                                                    <span className="flex items-center gap-1 text-xs text-gray-400 whitespace-nowrap"><TbClock size={12} />{compactTime(lp)}</span>
                                                </Tooltip>
                                            ) : <span className="text-xs text-gray-300">—</span>}
                                        </Td>
                                        <Td>
                                            <div className="flex gap-0.5">
                                                <Tooltip title={indexed ? 'Already indexed' : cooldown ? 'Cooldown (2h)' : 'Request indexing'}>
                                                    <Button size="xs" variant={indexDisabled ? 'plain' : 'solid'} color={indexDisabled ? undefined : 'emerald'} disabled={indexDisabled} className={indexDisabled ? 'opacity-20' : ''} loading={loading[`${p.slug}-index`]} onClick={() => push(p, 'index')} icon={<TbWorldUpload />} />
                                                </Tooltip>
                                                <Tooltip title="Check index status">
                                                    <Button size="xs" variant="plain" loading={loading[`${p.slug}-inspect`]} onClick={() => push(p, 'inspect')} icon={<TbEyeSearch />} />
                                                </Tooltip>
                                                <Tooltip title="Recheck">
                                                    <Button size="xs" variant="plain" loading={loading[`${p.slug}-recheck`]} onClick={() => push(p, 'recheck')} icon={<TbRefresh />} />
                                                </Tooltip>
                                                <Tooltip title="Request removal">
                                                    <Button size="xs" variant="plain" className="text-red-400 hover:text-red-600" loading={loading[`${p.slug}-remove`]} onClick={() => push(p, 'remove')} icon={<TbWorldOff />} />
                                                </Tooltip>
                                            </div>
                                        </Td>
                                    </Tr>
                                )
                            })}
                        </TBody>
                    </Table>
                </div>
                {filtered.length > PAGE_SIZE && (
                    <div className="flex justify-end mt-4">
                        <Pagination
                            total={filtered.length}
                            currentPage={currentPage}
                            pageSize={PAGE_SIZE}
                            onChange={(p) => setCurrentPage(p)}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}

export default TabIndexing
