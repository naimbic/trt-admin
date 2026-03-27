'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import Segment from '@/components/ui/Segment'
import Dialog from '@/components/ui/Dialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import {
    TbMail, TbMailOpened, TbSearch, TbRefresh,
    TbInbox, TbEye, TbFilter,
} from 'react-icons/tb'

const { Tr, Th, Td, THead, TBody } = Table

const PAGE_SIZE = 15

const formColors = {
    contact: 'bg-blue-500',
    'audit-seo': 'bg-emerald-500',
    'audit-ads': 'bg-amber-500',
    'audit-web': 'bg-purple-500',
    'audit-social': 'bg-pink-500',
    'audit-aeo': 'bg-cyan-500',
    'audit-analytics': 'bg-indigo-500',
    'audit-gratuit': 'bg-teal-500',
    newsletter: 'bg-orange-500',
    lead: 'bg-red-500',
    candidature: 'bg-lime-600',
}

const Page = () => {
    const [submissions, setSubmissions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [readFilter, setReadFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [detail, setDetail] = useState(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const params = readFilter !== 'all' ? `?read=${readFilter === 'read'}` : ''
            const res = await fetch(`/api/submissions${params}`, { cache: 'no-store' })
            const json = await res.json()
            setSubmissions(Array.isArray(json.data) ? json.data : [])
        } catch { setSubmissions([]) }
        setLoading(false)
    }, [readFilter])

    useEffect(() => { fetchData() }, [fetchData])
    useEffect(() => { setPage(1) }, [search, readFilter])

    const filtered = useMemo(() => {
        if (!search) return submissions
        const q = search.toLowerCase()
        return submissions.filter(s =>
            (s.name || '').toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) ||
            (s.form || '').toLowerCase().includes(q) ||
            (s.company || '').toLowerCase().includes(q) ||
            (s.message || '').toLowerCase().includes(q)
        )
    }, [submissions, search])

    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const unreadCount = submissions.filter(s => !s.read).length
    const totalCount = submissions.length

    const markRead = async (id, read) => {
        try {
            await fetch(`/api/submissions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read }),
            })
            setSubmissions(prev => prev.map(s => s.id === id ? { ...s, read } : s))
            if (detail?.id === id) setDetail(d => ({ ...d, read }))
            toast.push(<Notification type="success" title={read ? 'Marked as read' : 'Marked as unread'} />)
        } catch {
            toast.push(<Notification type="danger" title="Error">Failed to update</Notification>)
        }
    }

    const openDetail = (s) => {
        setDetail(s)
        if (!s.read) markRead(s.id, true)
    }

    const fmtDate = (d) => {
        if (!d) return ''
        const dt = new Date(d)
        return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
            ' ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="flex flex-col gap-4">
            <h4>Submissions</h4>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600"><TbInbox size={20} /></div>
                        <div><div className="text-xs text-gray-500">Total</div><h4>{totalCount}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600"><TbMail size={20} /></div>
                        <div><div className="text-xs text-gray-500">Unread</div><h4 className="text-red-600">{unreadCount}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600"><TbMailOpened size={20} /></div>
                        <div><div className="text-xs text-gray-500">Read</div><h4 className="text-emerald-600">{totalCount - unreadCount}</h4></div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                    <Input prefix={<TbSearch className="text-lg" />} placeholder="Search name, email, form..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" size="sm" />
                    <Segment size="sm" value={[readFilter]} onChange={v => { const val = Array.isArray(v) ? v[0] : v; if (val) setReadFilter(val) }}>
                        <Segment.Item value="all">All</Segment.Item>
                        <Segment.Item value="unread">Unread</Segment.Item>
                        <Segment.Item value="read">Read</Segment.Item>
                    </Segment>
                    <Button size="sm" variant="plain" icon={<TbRefresh />} onClick={fetchData}>Refresh</Button>
                </div>
            </Card>

            {/* Table */}
            <Card>
                <div className="overflow-auto">
                    <Table compact>
                        <THead>
                            <Tr>
                                <Th className="w-8"></Th>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th className="w-28">Form</Th>
                                <Th className="w-36">Date</Th>
                                <Th className="w-20">Action</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {loading ? (
                                <Tr><Td colSpan={6} className="text-center py-8 text-gray-400">Loading...</Td></Tr>
                            ) : paged.length === 0 ? (
                                <Tr><Td colSpan={6} className="text-center py-8 text-gray-400">No submissions</Td></Tr>
                            ) : paged.map(s => (
                                <Tr key={s.id} className={!s.read ? 'font-semibold' : 'opacity-75'}>
                                    <Td>{!s.read ? <TbMail className="text-red-500" size={16} /> : <TbMailOpened className="text-gray-400" size={16} />}</Td>
                                    <Td><div className="truncate max-w-[160px]">{s.name || '—'}</div></Td>
                                    <Td><div className="truncate max-w-[200px] text-sm">{s.email || '—'}</div></Td>
                                    <Td><Badge className={formColors[s.form] || 'bg-gray-400'} content={s.form} /></Td>
                                    <Td><span className="text-xs">{fmtDate(s.date)}</span></Td>
                                    <Td>
                                        <div className="flex gap-1">
                                            <Button size="xs" variant="plain" icon={<TbEye />} onClick={() => openDetail(s)} />
                                            <Button size="xs" variant="plain" icon={s.read ? <TbMail /> : <TbMailOpened />} onClick={() => markRead(s.id, !s.read)} />
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                </div>
                {filtered.length > PAGE_SIZE && (
                    <div className="flex justify-end mt-4">
                        <Pagination total={filtered.length} currentPage={page} pageSize={PAGE_SIZE} onChange={setPage} />
                    </div>
                )}
            </Card>

            {/* Detail Dialog */}
            <Dialog isOpen={!!detail} onClose={() => setDetail(null)} onRequestClose={() => setDetail(null)} width={520}>
                {detail && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h5>Submission Detail</h5>
                            <Badge className={formColors[detail.form] || 'bg-gray-400'} content={detail.form} />
                        </div>
                        <div className="flex flex-col gap-2 text-sm">
                            {[
                                ['Name', detail.name],
                                ['Email', detail.email],
                                ['Phone', detail.phone],
                                ['Company', detail.company],
                                ['Website', detail.website],
                                ['Needs', detail.needs],
                                ['Budget', detail.budget],
                                ['Deadline', detail.deadline],
                                ['Date', fmtDate(detail.date)],
                            ].filter(([,v]) => v).map(([k, v]) => (
                                <div key={k} className="flex gap-2">
                                    <span className="text-gray-500 w-20 shrink-0">{k}</span>
                                    <span className="break-all">{v}</span>
                                </div>
                            ))}
                            {detail.message && (
                                <div className="mt-2">
                                    <span className="text-gray-500 block mb-1">Message</span>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 whitespace-pre-wrap">{detail.message}</div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button size="sm" variant="plain" onClick={() => markRead(detail.id, !detail.read)}>
                                {detail.read ? 'Mark Unread' : 'Mark Read'}
                            </Button>
                            <Button size="sm" variant="solid" onClick={() => setDetail(null)}>Close</Button>
                        </div>
                    </>
                )}
            </Dialog>
        </div>
    )
}

export default Page
