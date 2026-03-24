'use client'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { TbPlus, TbTrash, TbArrowNarrowLeft, TbGripVertical } from 'react-icons/tb'
import { useRouter } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
]
const typeOptions = [
    { value: 'invoice', label: 'Invoice' },
    { value: 'devis', label: 'Quote' },
]
const currencyOptions = [
    { value: 'MAD', label: 'MAD (DH)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'USD', label: 'USD ($)' },
]
const periodOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
]
const cycleOptions = [
    { value: 0, label: '∞ Infinite' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}` })),
]
const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'check', label: 'Check' },
    { value: 'card', label: 'Card' },
    { value: 'other', label: 'Other' },
]

const emptyItem = { description: '', quantity: 1, unit: 'Unit', unitPrice: 0 }

const InvoiceForm = ({ invoiceId, initialData }) => {
    const router = useRouter()
    const isEdit = !!invoiceId
    const [submitting, setSubmitting] = useState(false)
    const [customers, setCustomers] = useState([])
    const [customerId, setCustomerId] = useState(initialData?.customerId || '')
    const [type, setType] = useState(initialData?.type || 'invoice')
    const [status, setStatus] = useState(initialData?.status || 'draft')
    const [currency, setCurrency] = useState(initialData?.currency || 'MAD')
    const [taxRate, setTaxRate] = useState(initialData?.taxRate ?? 20)
    const [notes, setNotes] = useState(initialData?.notes || '')
    const [dueDate, setDueDate] = useState(initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '')
    const [recurring, setRecurring] = useState(initialData?.recurring || false)
    const [recurringPeriod, setRecurringPeriod] = useState(initialData?.recurringPeriod || 'monthly')
    const [recurringCycles, setRecurringCycles] = useState(initialData?.recurringCycles ?? 0)
    const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '')
    const [paymentAmount, setPaymentAmount] = useState(initialData?.paymentAmount ?? '')
    const [paymentDate, setPaymentDate] = useState(initialData?.paymentDate ? initialData.paymentDate.slice(0, 10) : '')
    const [items, setItems] = useState(
        initialData?.items?.length
            ? initialData.items.map(i => ({ description: i.description, quantity: i.quantity, unit: i.unit || 'Unit', unitPrice: i.unitPrice }))
            : [{ ...emptyItem }]
    )

    useEffect(() => {
        fetch('/api/customers?pageSize=200')
            .then(r => r.json())
            .then(json => {
                const list = (json.list || []).map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
                setCustomers(list)
            })
            .catch(() => {})
    }, [])

    const updateItem = (index, field, value) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
    }
    const addItem = () => setItems(prev => [...prev, { ...emptyItem }])
    const removeItem = (index) => {
        if (items.length <= 1) return
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    const onDragEnd = (result) => {
        if (!result.destination) return
        const reordered = Array.from(items)
        const [moved] = reordered.splice(result.source.index, 1)
        reordered.splice(result.destination.index, 0, moved)
        setItems(reordered)
    }

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0), 0)
    const taxAmount = subtotal * ((parseFloat(taxRate) || 0) / 100)
    const total = subtotal + taxAmount
    const fmtNum = (amount) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!items.some(i => i.description.trim())) {
            toast.push(<Notification type="warning">Add at least one item</Notification>, { placement: 'top-center' })
            return
        }
        setSubmitting(true)
        try {
            const payload = {
                customerId: customerId || null, type, status, currency,
                taxRate: parseFloat(taxRate) || 20, notes, dueDate: dueDate || null,
                recurring, recurringPeriod: recurring ? recurringPeriod : null,
                recurringCycles: recurring ? recurringCycles : null,
                paymentMethod: paymentMethod || null,
                paymentAmount: paymentAmount !== '' ? parseFloat(paymentAmount) : null,
                paymentDate: paymentDate || null,
                items,
            }
            const url = isEdit ? `/api/invoices/${invoiceId}` : '/api/invoices'
            const method = isEdit ? 'PUT' : 'POST'
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Error')
            toast.push(
                <Notification type="success">
                    {isEdit ? 'Invoice updated' : `Invoice ${json.number} created`}
                    {json.nextInvoiceId ? ' — Next recurring invoice created' : ''}
                </Notification>,
                { placement: 'top-center' },
            )
            router.push('/concepts/invoices/invoice-list')
        } catch (err) {
            toast.push(<Notification type="danger">{err.message}</Notification>, { placement: 'top-center' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button type="button" variant="plain" icon={<TbArrowNarrowLeft />} onClick={() => router.push('/concepts/invoices/invoice-list')}>Back</Button>
                    <h3>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h3>
                </div>
                <Button variant="solid" type="submit" loading={submitting}>{isEdit ? 'Save' : 'Create'}</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <Select size="sm" options={typeOptions} value={typeOptions.find(o => o.value === type)} onChange={(o) => setType(o.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Client</label>
                    <Select size="sm" options={customers} value={customers.find(o => o.value === customerId) || null} onChange={(o) => setCustomerId(o?.value || '')} isClearable placeholder="Select..." />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Status</label>
                    <Select size="sm" options={statusOptions} value={statusOptions.find(o => o.value === status)} onChange={(o) => setStatus(o.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Currency</label>
                    <Select size="sm" options={currencyOptions} value={currencyOptions.find(o => o.value === currency)} onChange={(o) => setCurrency(o.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Due Date</label>
                    <Input size="sm" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">Tax Rate (%)</label>
                    <Input size="sm" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                </div>
            </div>

            {/* Recurring toggle */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                    <Switcher checked={recurring} onChange={(val) => setRecurring(val)} />
                    <span className="font-medium text-sm">Recurring Invoice</span>
                </div>
                {recurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Period</label>
                            <Select size="sm" options={periodOptions} value={periodOptions.find(o => o.value === recurringPeriod)} onChange={(o) => setRecurringPeriod(o.value)} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Cycles (0 = infinite)</label>
                            <Select size="sm" options={cycleOptions} value={cycleOptions.find(o => o.value === recurringCycles)} onChange={(o) => setRecurringCycles(o.value)} />
                        </div>
                    </div>
                )}
            </div>

            {/* Payment section */}
            {isEdit && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                    <h5 className="mb-3 text-sm font-semibold">Payment</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Method</label>
                            <Select size="sm" options={paymentMethodOptions} value={paymentMethodOptions.find(o => o.value === paymentMethod) || null} onChange={(o) => setPaymentMethod(o?.value || '')} isClearable placeholder="Select..." />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Amount Received</label>
                            <Input size="sm" type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder={fmtNum(total)} />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Payment Date</label>
                            <Input size="sm" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                        </div>
                    </div>
                </div>
            )}

            {/* Items table with drag-to-reorder */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h5>Items</h5>
                    <Button type="button" size="xs" icon={<TbPlus />} onClick={addItem}>Add</Button>
                </div>
                <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-800 text-white">
                            <tr>
                                <th className="w-8"></th>
                                <th className="text-left p-3 font-medium w-10">#</th>
                                <th className="text-left p-3 font-medium">Description</th>
                                <th className="text-left p-3 font-medium w-24">Qty</th>
                                <th className="text-left p-3 font-medium w-24">Unit</th>
                                <th className="text-right p-3 font-medium w-28">Unit Price</th>
                                <th className="text-right p-3 font-medium w-28">Amount HT</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="invoice-items">
                                {(provided) => (
                                    <tbody ref={provided.innerRef} {...provided.droppableProps}>
                                        {items.map((item, idx) => (
                                            <Draggable key={`item-${idx}`} draggableId={`item-${idx}`} index={idx}>
                                                {(dragProvided, snapshot) => (
                                                    <tr
                                                        ref={dragProvided.innerRef}
                                                        {...dragProvided.draggableProps}
                                                        className={`border-t dark:border-gray-700 ${snapshot.isDragging ? 'bg-gray-100 dark:bg-gray-700 shadow-lg' : ''}`}
                                                    >
                                                        <td className="p-1 text-center" {...dragProvided.dragHandleProps}>
                                                            <TbGripVertical className="text-gray-400 cursor-grab mx-auto" />
                                                        </td>
                                                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                        <td className="p-2">
                                                            <textarea className="w-full border rounded p-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-none" rows={2} placeholder="Service description..." value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input size="sm" type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input size="sm" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} placeholder="Unit" />
                                                        </td>
                                                        <td className="p-2">
                                                            <Input size="sm" type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} />
                                                        </td>
                                                        <td className="p-2 text-right font-medium">{fmtNum((parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0))}</td>
                                                        <td className="p-2">
                                                            {items.length > 1 && <Button type="button" size="xs" variant="plain" icon={<TbTrash />} onClick={() => removeItem(idx)} />}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </tbody>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </table>
                </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
                <div className="w-80 text-sm">
                    <div className="flex justify-between py-2"><span>Total HT</span><span className="font-semibold">{fmtNum(subtotal)} DH</span></div>
                    <div className="flex justify-between py-2"><span>Tax ({taxRate}%)</span><span className="font-semibold">{fmtNum(taxAmount)} DH</span></div>
                    <div className="flex justify-between py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 rounded">
                        <span className="font-bold">Total TTC</span><span className="font-bold text-lg">{fmtNum(total)} DH</span>
                    </div>
                </div>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium">Notes</label>
                <textarea className="w-full border rounded-lg p-3 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" rows={3} placeholder="Additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
        </form>
    )
}

export default InvoiceForm
