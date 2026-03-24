import Container from '@/components/shared/Container'
import AdaptiveCard from '@/components/shared/AdaptiveCard'
import InvoiceList from './_components/InvoiceList'

export default function Page() {
    return (
        <Container>
            <AdaptiveCard>
                <InvoiceList />
            </AdaptiveCard>
        </Container>
    )
}
