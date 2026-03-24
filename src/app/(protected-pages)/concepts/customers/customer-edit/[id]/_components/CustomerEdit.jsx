'use client'
import { useState } from 'react'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import CustomerForm from '@/components/view/CustomerForm'
import { TbTrash, TbArrowNarrowLeft } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

const CustomerEdit = ({ data }) => {
    const router = useRouter()

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [isSubmiting, setIsSubmiting] = useState(false)

    const handleFormSubmit = async (values) => {
        setIsSubmiting(true)
        try {
            const res = await fetch(`/api/customers/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || 'Failed to save customer')
            }
            toast.push(
                <Notification type="success">Changes Saved!</Notification>,
                { placement: 'top-center' },
            )
            router.push('/concepts/customers/customer-list')
        } catch (err) {
            toast.push(
                <Notification type="danger">{err.message}</Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmiting(false)
        }
    }

    const getDefaultValues = () => {
        if (data) {
            const { firstName, lastName, email, personalInfo, img } = data

            return {
                firstName,
                lastName,
                email,
                img,
                phoneNumber: personalInfo.phoneNumber || '',
                dialCode: personalInfo.dialCode || '',
                country: personalInfo.country || '',
                address: personalInfo.address || '',
                city: personalInfo.city || '',
                postcode: personalInfo.postcode || '',
                tags: [],
                birthday: personalInfo.birthday ? new Date(personalInfo.birthday).toISOString().slice(0, 10) : '',
                gender: personalInfo.gender || '',
                password: '',
                facebook: personalInfo.facebook || '',
                twitter: personalInfo.twitter || '',
                linkedIn: personalInfo.linkedIn || '',
                pinterest: personalInfo.pinterest || '',
                deliveryAddress: personalInfo.deliveryAddress || '',
                deliveryCity: personalInfo.deliveryCity || '',
                deliveryCountry: personalInfo.deliveryCountry || '',
                deliveryPostcode: personalInfo.deliveryPostcode || '',
            }
        }

        return {}
    }

    const handleConfirmDelete = async () => {
        try {
            const res = await fetch(`/api/customers/${data.id}`, { method: 'DELETE' })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete customer')
            }
            setDeleteConfirmationOpen(false)
            toast.push(
                <Notification type="success">Customer deleted!</Notification>,
                { placement: 'top-center' },
            )
            router.push('/concepts/customers/customer-list')
        } catch (err) {
            toast.push(
                <Notification type="danger">{err.message}</Notification>,
                { placement: 'top-center' },
            )
        }
    }

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleBack = () => {
        history.back()
    }

    return (
        <>
            <CustomerForm
                defaultValues={getDefaultValues()}
                newCustomer={false}
                onFormSubmit={handleFormSubmit}
            >
                <Container>
                    <div className="flex items-center justify-between px-8">
                        <Button
                            className="ltr:mr-3 rtl:ml-3"
                            type="button"
                            variant="plain"
                            icon={<TbArrowNarrowLeft />}
                            onClick={handleBack}
                        >
                            Back
                        </Button>
                        <div className="flex items-center">
                            <Button
                                className="ltr:mr-3 rtl:ml-3"
                                type="button"
                                customColorClass={() =>
                                    'border-error ring-1 ring-error text-error hover:border-error hover:ring-error hover:text-error bg-transparent'
                                }
                                icon={<TbTrash />}
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>
                            <Button
                                variant="solid"
                                type="submit"
                                loading={isSubmiting}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </Container>
            </CustomerForm>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Remove customers"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to remove this customer? This action
                    can&apos;t be undo.{' '}
                </p>
            </ConfirmDialog>
        </>
    )
}

export default CustomerEdit
