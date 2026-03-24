import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import InvoiceForm from '../_components/InvoiceForm'

export default function Page() {
    return (
        <Container>
            <AdaptiveCard>
                <InvoiceForm />
            </AdaptiveCard>
        </Container>
    )
}
