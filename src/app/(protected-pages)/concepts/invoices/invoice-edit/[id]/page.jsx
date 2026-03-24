'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import InvoiceForm from '../../_components/InvoiceForm'
import Spinner from '@/components/ui/Spinner'

export default function Page() {
    const { id } = useParams()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`/api/invoices/${id}`)
            .then(r => r.json())
            .then(json => {
                if (!json.error) setData(json)
            })
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <Container>
                <div className="flex justify-center py-20"><Spinner size={40} /></div>
            </Container>
        )
    }

    if (!data) {
        return (
            <Container>
                <div className="text-center py-20 text-gray-400">Invoice not found</div>
            </Container>
        )
    }

    return (
        <Container>
            <AdaptiveCard>
                <InvoiceForm invoiceId={id} initialData={data} />
            </AdaptiveCard>
        </Container>
    )
}
