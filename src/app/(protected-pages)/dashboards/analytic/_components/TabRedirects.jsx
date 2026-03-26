'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Dialog from '@/components/ui/Dialog'
import Switcher from '@/components/ui/Switcher'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import Tabs from '@/components/ui/Tabs'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { NumericFormat } from 'react-number-format'
import {
    TbAlertTriangle, TbArrowRight, TbPlus, TbEdit, TbTrash,
    TbRefresh, TbSearch,
} from 'react-icons/tb'

const { Tr, Th, Td, THead, TBody } = Table
const { TabNav, TabList, TabContent } = Tabs

const PAGE_SIZE = 15

const TabRedirects = () => {
    const [errors, setErrors] = useState([])
    const [redirects, setRedirects] = useState([])
    const [loading, setLoading] = useState(true)
    const [subTab, setSubTab] = useState('errors')
    const [search, setSearch] = useState('')

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editItem, setEditItem] = useState(null)
    const [form, setForm] = useState({ from: '', to: '', type: 301, note: '' })

    // Pagination
    const [errPage, setErrPage] = useState(1)
    const [redPage, setRedPage] = useState(1)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [errRes, redRes] = await Promise.all([
                fetch('/api/admin/errors').then(r => r.json()),
                fetch('/api/redirects').then(r => r.json()),
            ])
            setErrors(Array.isArray(errRes.data) ? errRes.data : [])
            setRedirects(Array.isArray(redRes.data) ? redRes.data : [])
        } catch (err) { console.error('TabRedirects fetch error:', err) }
        setLoading(false)
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const redirectMap = useMemo(() => new Map(redirects.map(r => [r.from, r])), [redirects])

    const filteredErrors = useMemo(() => {
        if (!search) return errors
        const q = search.toLowerCase()
        return errors.filter(e => e.path.toLowerCase().includes(q))
    }, [errors, search])

    const filteredRedirects = useMemo(() => {
        if (!search) return redirects
        const q = search.toLowerCase()
        return redirects.filter(r => r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q))
    }, [redirects, search])

    useEffect(() => { setErrPage(1); setRedPage(1) }, [search])

    const pagedErrors = filteredErrors.slice((errPage - 1) * PAGE_SIZE, errPage * PAGE_SIZE)
    const pagedRedirects = filteredRedirects.slice((redPage - 1) * PAGE_SIZE, redPage * PAGE_SIZE)

    const openCreate = (fromPath) => {
        setEditItem(null)
        setForm({ from: fromPath || '', to: '', type: 301, note: '' })
        setDialogOpen(true)
    }
    const openEdit = (r) => {
        setEditItem(r)
        setForm({ from: r.from, to: r.to, type: r.type, note: r.note || '' })
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!form.from || !form.to) {
            toast.push(<Notification type="warning" title="Required">From and To are required</Notification>)
            return
        }
        try {
            const url = editItem ? `/api/redirects/${editItem.id}` : '/api/redirects'
            const method = editItem ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
            const json = await res.json()
            if (json.error) {
                toast.push(<Notification type="danger" title="Error">{json.error}</Notification>)
            } else {
                toast.push(<Notification type="success" title={editItem ? 'Updated' : 'Created'}>Redirect saved</Notification>)
                setDialogOpen(false)
                fetchData()
            }
        } catch {
            toast.push(<Notification type="danger" title="Error">Failed</Notification>)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this redirect?')) return
        try {
            await fetch(`/api/redirects/${id}`, { method: 'DELETE' })
            toast.push(<Notification type="success" title="Deleted" />)
            fetchData()
        } catch { /* ignore */ }
    }

    const handleToggle = async (r) => {
        try {
            await fetch(`/api/redirects/${r.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !r.active }),
            })
            fetchData()
        } catch { /* ignore */ }
    }

    const errCount = errors.length
    const redCount = redirects.length
    const unresolvedCount = errors.filter(e => !redirectMap.has(e.path)).length
    const totalHits = errors.reduce((s, e) => s + e.hitCount, 0)

    return (
        <div className="flex flex-col gap-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600"><TbAlertTriangle size={20} /></div>
                        <div><div className="text-xs text-gray-500">404 Paths</div><h4>{errCount}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600"><TbAlertTriangle size={20} /></div>
                        <div><div className="text-xs text-gray-500">Unresolved</div><h4 className="text-amber-600">{unresolvedCount}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600"><TbArrowRight size={20} /></div>
                        <div><div className="text-xs text-gray-500">Redirects</div><h4 className="text-emerald-600">{redCount}</h4></div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600"><TbRefresh size={20} /></div>
                        <div><div className="text-xs text-gray-500">Total Hits</div><h4><NumericFormat displayType="text" value={totalHits} thousandSeparator /></h4></div>
                    </div>
                </Card>
            </div>

            {/* Search + actions */}
            <Card>
                <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
                    <Input prefix={<TbSearch className="text-lg" />} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" size="sm" />
                    <Button size="sm" variant="plain" icon={<TbRefresh />} onClick={fetchData}>Refresh</Button>
                    <Button size="sm" variant="solid" icon={<TbPlus />} onClick={() => openCreate('')}>New Redirect</Button>
                </div>
            </Card>

            {/* Sub-tabs */}
            <Tabs value={subTab} onChange={setSubTab}>
                <TabList>
                    <TabNav value="errors">404 Errors ({filteredErrors.length})</TabNav>
                    <TabNav value="redirects">Redirects ({filteredRedirects.length})</TabNav>
                </TabList>
                <div className="mt-4">
                    <TabContent value="errors">
                        <Card>
                            <div className="overflow-auto">
                                <Table compact>
                                    <THead>
                                        <Tr>
                                            <Th>Path</Th>
                                            <Th className="w-20">Hits</Th>
                                            <Th className="w-24">Status</Th>
                                            <Th className="w-20">Action</Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {loading ? (
                                            <Tr><Td colSpan={4} className="text-center py-8 text-gray-400">Loading...</Td></Tr>
                                        ) : pagedErrors.length === 0 ? (
                                            <Tr><Td colSpan={4} className="text-center py-8 text-gray-400">No 404 errors</Td></Tr>
                                        ) : pagedErrors.map(e => {
                                            const has = redirectMap.has(e.path)
                                            return (
                                                <Tr key={e.id}>
                                                    <Td>
                                                        <div className="text-sm font-medium truncate max-w-[350px]">{e.path}</div>
                                                        {e.referrer && <div className="text-xs text-gray-400 truncate max-w-[350px]">from: {e.referrer}</div>}
                                                    </Td>
                                                    <Td><NumericFormat displayType="text" value={e.hitCount} thousandSeparator /></Td>
                                                    <Td>{has ? <Badge className="bg-emerald-500" content="Fixed" /> : <Badge className="bg-red-500" content="Open" />}</Td>
                                                    <Td>{!has && <Button size="xs" variant="solid" onClick={() => openCreate(e.path)} icon={<TbArrowRight />}>Fix</Button>}</Td>
                                                </Tr>
                                            )
                                        })}
                                    </TBody>
                                </Table>
                            </div>
                            {filteredErrors.length > PAGE_SIZE && (
                                <div className="flex justify-end mt-4">
                                    <Pagination total={filteredErrors.length} currentPage={errPage} pageSize={PAGE_SIZE} onChange={setErrPage} />
                                </div>
                            )}
                        </Card>
                    </TabContent>
                    <TabContent value="redirects">
                        <Card>
                            <div className="overflow-auto">
                                <Table compact>
                                    <THead>
                                        <Tr>
                                            <Th>From</Th>
                                            <Th>To</Th>
                                            <Th className="w-16">Type</Th>
                                            <Th className="w-16">Hits</Th>
                                            <Th className="w-16">Active</Th>
                                            <Th className="w-24">Actions</Th>
                                        </Tr>
                                    </THead>
                                    <TBody>
                                        {loading ? (
                                            <Tr><Td colSpan={6} className="text-center py-8 text-gray-400">Loading...</Td></Tr>
                                        ) : pagedRedirects.length === 0 ? (
                                            <Tr><Td colSpan={6} className="text-center py-8 text-gray-400">No redirects</Td></Tr>
                                        ) : pagedRedirects.map(r => (
                                            <Tr key={r.id}>
                                                <Td><div className="text-sm truncate max-w-[180px]">{r.from}</div></Td>
                                                <Td><div className="text-sm truncate max-w-[180px]">{r.to}</div></Td>
                                                <Td><Badge className={r.type === 301 ? 'bg-blue-500' : 'bg-amber-500'} content={r.type} /></Td>
                                                <Td><NumericFormat displayType="text" value={r.hits} thousandSeparator /></Td>
                                                <Td><Switcher checked={r.active} onChange={() => handleToggle(r)} /></Td>
                                                <Td>
                                                    <div className="flex gap-1">
                                                        <Button size="xs" variant="plain" icon={<TbEdit />} onClick={() => openEdit(r)} />
                                                        <Button size="xs" variant="plain" className="text-red-400" icon={<TbTrash />} onClick={() => handleDelete(r.id)} />
                                                    </div>
                                                </Td>
                                            </Tr>
                                        ))}
                                    </TBody>
                                </Table>
                            </div>
                            {filteredRedirects.length > PAGE_SIZE && (
                                <div className="flex justify-end mt-4">
                                    <Pagination total={filteredRedirects.length} currentPage={redPage} pageSize={PAGE_SIZE} onChange={setRedPage} />
                                </div>
                            )}
                        </Card>
                    </TabContent>
                </div>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} onRequestClose={() => setDialogOpen(false)}>
                <h5 className="mb-4">{editItem ? 'Edit Redirect' : 'Create Redirect'}</h5>
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-sm mb-1 block">From</label>
                        <Input size="sm" placeholder="/old-page" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} />
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">To</label>
                        <Input size="sm" placeholder="/new-page" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} />
                    </div>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={form.type === 301} onChange={() => setForm(f => ({ ...f, type: 301 }))} />
                            301 Permanent
                        </label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={form.type === 302} onChange={() => setForm(f => ({ ...f, type: 302 }))} />
                            302 Temporary
                        </label>
                    </div>
                    <div>
                        <label className="text-sm mb-1 block">Note</label>
                        <Input size="sm" placeholder="Optional note..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button size="sm" variant="plain" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="solid" onClick={handleSave}>{editItem ? 'Update' : 'Create'}</Button>
                </div>
            </Dialog>
        </div>
    )
}

export default TabRedirects
