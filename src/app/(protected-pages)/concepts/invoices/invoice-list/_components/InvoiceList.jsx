'use client'
import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Tag from '@/components/ui/Tag'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { TbPlus, TbSearch, TbFileInvoice, TbEye, TbPencil, TbTrash, TbRepeat } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

const { Tr, Th, Td, THead, TBody } = Table

const statusMap = {
    draft: { label: 'Brouillon', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    sent: { label: 'Envoyée', cls: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
    paid: { label: 'Payée', cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
    overdue: { label: 'En retard', cls: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' },
    cancelled: { label: 'Annulée', cls: 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500' },
}

const typeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'invoice', label: 'Facture' },
    { value: 'devis', label: 'Devis' },
]
const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'sent', label: 'Envoyée' },
    { value: 'paid', label: 'Payée' },
    { value: 'overdue', label: 'En retard' },
    { value: 'cancelled', label: 'Annulée' },
]

const InvoiceList = () => {
    const router = useRouter()
    const [data, setData] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [query, setQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [deleteId, setDeleteId] = useState(null)

    const fetchInvoices = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ pageIndex: String(page), pageSize: String(pageSize) })
            if (query) params.set('query', query)
            if (statusFilter) params.set('status', statusFilter)
            if (typeFilter) params.set('type', typeFilter)
            const res = await fetch(`/api/invoices?${params}`)
            const json = await res.json()
            setData(json.list || [])
            setTotal(json.total || 0)
        } catch {
            toast.push(<Notification type="danger">Erreur de chargement</Notification>, { placement: 'top-center' })
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, query, statusFilter, typeFilter])

    useEffect(() => { fetchInvoices() }, [fetchInvoices])

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            const res = await fetch(`/api/invoices/${deleteId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error()
            toast.push(<Notification type="success">Facture supprimée</Notification>, { placement: 'top-center' })
            setDeleteId(null)
            fetchInvoices()
        } catch {
            toast.push(<Notification type="danger">Erreur de suppression</Notification>, { placement: 'top-center' })
        }
    }

    const fmt = (amount) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)
    const fmtDate = (dateStr) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 className="flex items-center gap-2">
                    <TbFileInvoice className="text-xl" />
                    Factures & Devis
                </h3>
                <Button variant="solid" size="sm" icon={<TbPlus />} onClick={() => router.push('/concepts/invoices/invoice-create')}>
                    Nouvelle Facture
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-2">
                <Input size="sm" placeholder="Rechercher par numéro..." prefix={<TbSearch />} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} className="md:w-[240px]" />
                <Select size="sm" options={typeOptions} value={typeOptions.find(o => o.value === typeFilter)} onChange={(opt) => { setTypeFilter(opt.value); setPage(1) }} className="md:w-[160px]" />
                <Select size="sm" options={statusOptions} value={statusOptions.find(o => o.value === statusFilter)} onChange={(opt) => { setStatusFilter(opt.value); setPage(1) }} className="md:w-[160px]" />
            </div>

            <Table>
                <THead>
                    <Tr>
                        <Th>Numéro</Th>
                        <Th>Type</Th>
                        <Th>Client</Th>
                        <Th>Statut</Th>
                        <Th>Total TTC</Th>
                        <Th>Date</Th>
                        <Th>Échéance</Th>
                        <Th></Th>
                    </Tr>
                </THead>
                <TBody>
                    {loading ? (
                        <Tr><Td colSpan={8} className="text-center py-8 text-gray-400">Chargement...</Td></Tr>
                    ) : data.length === 0 ? (
                        <Tr><Td colSpan={8} className="text-center py-8 text-gray-400">Aucune facture trouvée</Td></Tr>
                    ) : data.map((inv) => (
                        <Tr key={inv.id}>
                            <Td>
                                <span className="font-semibold">{inv.number}</span>
                                {inv.recurring && <TbRepeat className="inline ml-1 text-blue-500" title="Récurrente" />}
                            </Td>
                            <Td>
                                <Tag className={inv.type === 'devis' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}>
                                    {inv.type === 'devis' ? 'Devis' : 'Facture'}
                                </Tag>
                            </Td>
                            <Td>{inv.customer ? `${inv.customer.firstName} ${inv.customer.lastName}` : '—'}</Td>
                            <Td>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusMap[inv.status]?.cls || ''}`}>
                                    {statusMap[inv.status]?.label || inv.status}
                                </span>
                            </Td>
                            <Td className="font-semibold">{fmt(inv.total)} DH</Td>
                            <Td>{fmtDate(inv.createdAt)}</Td>
                            <Td>{fmtDate(inv.dueDate)}</Td>
                            <Td>
                                <div className="flex gap-1">
                                    <Button size="xs" variant="plain" icon={<TbEye />} onClick={() => router.push(`/concepts/invoices/invoice-detail/${inv.id}`)} />
                                    <Button size="xs" variant="plain" icon={<TbPencil />} onClick={() => router.push(`/concepts/invoices/invoice-edit/${inv.id}`)} />
                                    <Button size="xs" variant="plain" icon={<TbTrash />} onClick={() => setDeleteId(inv.id)} />
                                </div>
                            </Td>
                        </Tr>
                    ))}
                </TBody>
            </Table>

            {total > pageSize && (
                <div className="flex justify-end">
                    <Pagination total={total} currentPage={page} pageSize={pageSize} onChange={(p) => setPage(p)} />
                </div>
            )}

            <ConfirmDialog isOpen={!!deleteId} type="danger" title="Supprimer la facture" onClose={() => setDeleteId(null)} onRequestClose={() => setDeleteId(null)} onCancel={() => setDeleteId(null)} onConfirm={handleDelete}>
                <p>Êtes-vous sûr de vouloir supprimer cette facture ? Les numéros suivants seront décrémentés.</p>
            </ConfirmDialog>
        </div>
    )
}

export default InvoiceList
