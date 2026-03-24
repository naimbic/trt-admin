'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { TbArrowNarrowLeft, TbPencil, TbDownload } from 'react-icons/tb'
import { numberToFrenchWords } from '@/utils/numberToWords'

const COMPANY = {
    name: 'TRT Digital sarl',
    capital: '100.000,00 MAD',
    phone1: '+212 80 8573256',
    phone2: '+212 6 8449 6060',
    email: 'commercial@trtdigital.ma',
    website: 'www.trtdigital.ma',
    address: 'Bd. Zerktouni, Rés. Nassim N°18,',
    address2: 'Quartier Bourgogne, Casablanca, Maroc',
    rc: '420807',
    idf: '31888642',
    cnss: '6841309',
    ice: '002143944000008',
    tp: '34257279',
    logo: process.env.NEXT_PUBLIC_LOGO_LIGHT || 'https://trt-admin.ams3.cdn.digitaloceanspaces.com/logo/trtDigital-Logo-Maroc-2.svg',
}

const fmt = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

async function loadLogoAsBase64() {
    try {
        const res = await fetch(COMPANY.logo)
        const text = await res.text()
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(text)))}`
    } catch {
        return COMPANY.logo
    }
}

export default function Page() {
    const { id } = useParams()
    const router = useRouter()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [logoBase64, setLogoBase64] = useState(COMPANY.logo)
    const printRef = useRef(null)

    useEffect(() => {
        fetch(`/api/invoices/${id}`)
            .then(r => r.json())
            .then(json => { if (!json.error) setData(json) })
            .finally(() => setLoading(false))
        loadLogoAsBase64().then(setLogoBase64)
    }, [id])

    const handleDownloadPdf = async () => {
        const element = printRef.current
        if (!element) return
        const html2pdf = (await import('html2pdf.js')).default
        html2pdf().set({
            margin: [10, 10, 10, 10],
            filename: `${data.number.replace(/\//g, '-')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, allowTaint: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        }).from(element).save()
    }

    if (loading) return <Container><div className="flex justify-center py-20"><Spinner size={40} /></div></Container>
    if (!data) return <Container><div className="text-center py-20 text-gray-400">Invoice not found</div></Container>

    const isDevis = data.type === 'devis'
    const docLabel = isDevis ? 'DEVIS' : 'FACTURE'
    const statusLabel = { draft: 'BROUILLON', sent: 'ENVOYÉE', paid: 'PAYÉE', overdue: 'EN RETARD', cancelled: 'ANNULÉE' }
    const statusBg = { draft: '#e5e7eb', sent: '#dbeafe', paid: '#d1fae5', overdue: '#fee2e2', cancelled: '#f3f4f6' }
    const statusFg = { draft: '#6b7280', sent: '#2563eb', paid: '#059669', overdue: '#dc2626', cancelled: '#9ca3af' }

    return (
        <Container>
            <div className="flex items-center justify-between mb-4 print:hidden">
                <Button variant="plain" icon={<TbArrowNarrowLeft />} onClick={() => router.push('/concepts/invoices/invoice-list')}>Back</Button>
                <div className="flex gap-2">
                    <Button size="sm" icon={<TbPencil />} onClick={() => router.push(`/concepts/invoices/invoice-edit/${id}`)}>Edit</Button>
                    <Button size="sm" variant="solid" icon={<TbDownload />} onClick={handleDownloadPdf}>Download PDF</Button>
                </div>
            </div>

            <AdaptiveCard>
                <div ref={printRef} style={{ fontFamily: "'Segoe UI', Arial, Helvetica, sans-serif", color: '#1a1a1a', fontSize: '13px', lineHeight: '1.6', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '3px solid #1f2937' }}>
                        <div>
                            <img src={logoBase64} alt="TRT Digital" style={{ height: '48px', marginBottom: '6px' }} />
                            <div style={{ fontSize: '10px', color: '#666', fontWeight: 600, letterSpacing: '1px' }}>AGENCE WEB CASABLANCA</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1f2937', letterSpacing: '2px' }}>{docLabel}</div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>{data.number}</div>
                            <div style={{ display: 'inline-block', marginTop: '6px', padding: '3px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, backgroundColor: statusBg[data.status] || '#e5e7eb', color: statusFg[data.status] || '#6b7280' }}>
                                {statusLabel[data.status] || data.status?.toUpperCase()}
                            </div>
                        </div>
                    </div>

                    {/* Company + Customer info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0', gap: '40px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Bill To</div>
                            {data.customer ? (
                                <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '14px' }}>
                                    <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{data.customer.firstName} {data.customer.lastName}</div>
                                    {data.customer.email && <div style={{ fontSize: '12px', color: '#6b7280' }}>{data.customer.email}</div>}
                                    {data.customer.phone && <div style={{ fontSize: '12px', color: '#6b7280' }}>{data.customer.phone}</div>}
                                    {data.customer.address && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{data.customer.address}</div>}
                                    {(data.customer.city || data.customer.country) && <div style={{ fontSize: '12px', color: '#6b7280' }}>{[data.customer.city, data.customer.country].filter(Boolean).join(', ')}</div>}
                                </div>
                            ) : <div style={{ color: '#d1d5db', fontStyle: 'italic' }}>No client</div>}
                        </div>
                        <div style={{ flex: 1, textAlign: 'right' }}>
                            <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>From</div>
                            <div style={{ fontSize: '12px', lineHeight: '1.7' }}>
                                <div style={{ fontWeight: 700 }}>{COMPANY.name}</div>
                                <div style={{ color: '#6b7280' }}>Capital: {COMPANY.capital}</div>
                                <div style={{ color: '#6b7280' }}>{COMPANY.phone1} | {COMPANY.phone2}</div>
                                <div style={{ color: '#6b7280' }}>{COMPANY.email}</div>
                                <div style={{ color: '#6b7280' }}>{COMPANY.website}</div>
                                <div style={{ color: '#6b7280', marginTop: '4px' }}>{COMPANY.address}</div>
                                <div style={{ color: '#6b7280' }}>{COMPANY.address2}</div>
                            </div>
                        </div>
                    </div>

                    {/* Dates + Recurring */}
                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
                        <div style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '10px 16px', fontSize: '12px' }}>
                            <span style={{ color: '#9ca3af', fontWeight: 600 }}>Date: </span>
                            <span style={{ fontWeight: 600 }}>{fmtDate(data.createdAt)}</span>
                        </div>
                        {data.dueDate && (
                            <div style={{ backgroundColor: '#f3f4f6', borderRadius: '6px', padding: '10px 16px', fontSize: '12px' }}>
                                <span style={{ color: '#9ca3af', fontWeight: 600 }}>Due: </span>
                                <span style={{ fontWeight: 600 }}>{fmtDate(data.dueDate)}</span>
                            </div>
                        )}
                        {data.recurring && (
                            <div style={{ backgroundColor: '#eff6ff', borderRadius: '6px', padding: '10px 16px', fontSize: '12px', color: '#2563eb' }}>
                                🔄 Recurring ({data.recurringPeriod === 'monthly' ? 'Monthly' : 'Yearly'}{data.recurringCycles > 0 ? ` × ${data.recurringCycles}` : ' ∞'})
                            </div>
                        )}
                    </div>

                    {/* Items table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#1f2937', color: '#fff' }}>
                                <th style={{ padding: '10px 14px', textAlign: 'left', width: '36px', fontSize: '11px', fontWeight: 600 }}>#</th>
                                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600 }}>Description</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', width: '70px', fontSize: '11px', fontWeight: 600 }}>Qty</th>
                                <th style={{ padding: '10px 14px', textAlign: 'center', width: '70px', fontSize: '11px', fontWeight: 600 }}>Unit</th>
                                <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px', fontSize: '11px', fontWeight: 600 }}>Unit Price</th>
                                <th style={{ padding: '10px 14px', textAlign: 'right', width: '110px', fontSize: '11px', fontWeight: 600 }}>Amount HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data.items || []).map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>{idx + 1}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: '12px' }}>{item.description}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px' }}>{item.quantity}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>{item.unit || ''}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '12px' }}>{fmt(item.unitPrice)}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: '12px' }}>{fmt(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                        <div style={{ width: '280px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>Total HT</span>
                                <span style={{ fontWeight: 600 }}>{fmt(data.subtotal)} DH</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', borderBottom: '1px solid #f3f4f6' }}>
                                <span style={{ color: '#6b7280' }}>TVA ({data.taxRate || 20}%)</span>
                                <span style={{ fontWeight: 600 }}>{fmt(data.taxAmount)} DH</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '15px', fontWeight: 800, backgroundColor: '#1f2937', color: '#fff', borderRadius: '6px', marginTop: '6px' }}>
                                <span>Total TTC</span>
                                <span>{fmt(data.total)} DH</span>
                            </div>
                        </div>
                    </div>

                    {/* Total in words */}
                    <div style={{ textAlign: 'center', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                        <span style={{ fontWeight: 700, color: '#374151' }}>In words: </span>
                        <span style={{ color: '#6b7280' }}>{numberToFrenchWords(data.total)} Dirhams</span>
                    </div>

                    {/* Payment info */}
                    {data.paymentMethod && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#ecfdf5', borderRadius: '6px', fontSize: '12px', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, marginBottom: '6px', color: '#065f46', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment</div>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <div><span style={{ color: '#6b7280' }}>Method: </span><span style={{ fontWeight: 600 }}>{{ cash: 'Cash', bank_transfer: 'Bank Transfer', check: 'Check', card: 'Card', other: 'Other' }[data.paymentMethod] || data.paymentMethod}</span></div>
                                {data.paymentAmount != null && <div><span style={{ color: '#6b7280' }}>Amount: </span><span style={{ fontWeight: 600 }}>{fmt(data.paymentAmount)} DH</span></div>}
                                {data.paymentDate && <div><span style={{ color: '#6b7280' }}>Date: </span><span style={{ fontWeight: 600 }}>{fmtDate(data.paymentDate)}</span></div>}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {data.notes && (
                        <div style={{ padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#6b7280', fontSize: '11px', textTransform: 'uppercase' }}>Notes</div>
                            <div style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>{data.notes}</div>
                        </div>
                    )}

                    {/* Footer - Company legal info */}
                    <div style={{ borderTop: '2px solid #1f2937', paddingTop: '12px', marginTop: '8px', textAlign: 'center', fontSize: '10px', color: '#9ca3af', lineHeight: '1.8' }}>
                        <div>{COMPANY.name} au capital de {COMPANY.capital}</div>
                        <div>RC: {COMPANY.rc} — IF: {COMPANY.idf} — CNSS: {COMPANY.cnss} — ICE: {COMPANY.ice} — TP: {COMPANY.tp}</div>
                        <div>{COMPANY.address} {COMPANY.address2}</div>
                        <div>{COMPANY.phone1} | {COMPANY.phone2} | {COMPANY.email} | {COMPANY.website}</div>
                    </div>
                </div>
            </AdaptiveCard>
        </Container>
    )
}
