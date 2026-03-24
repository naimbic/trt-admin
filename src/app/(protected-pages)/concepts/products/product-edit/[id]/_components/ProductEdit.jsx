'use client'
import { useState } from 'react'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ProductForm from '@/components/view/ProductForm'
import { TbTrash, TbArrowNarrowLeft } from 'react-icons/tb'
import { useRouter } from 'next/navigation'

const ProductEdit = ({ data }) => {
    const router = useRouter()

    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

    const [isSubmiting, setIsSubmiting] = useState(false)

    const getDefaultValues = () => {
        if (data) {
            return {
                name: data.name || '',
                description: data.description || '',
                productCode: data.sku || '',
                taxRate: data.taxRate ?? 0,
                price: data.price ?? '',
                bulkDiscountPrice: data.bulkDiscountPrice ?? '',
                costPerItem: data.costPerItem ?? '',
                imgList: Array.isArray(data.images)
                    ? data.images.map((url, i) => ({
                          id: `img-${i}`,
                          name: url.split('/').pop() || `image-${i}`,
                          img: url,
                      }))
                    : [],
                category: data.category || '',
                tags: Array.isArray(data.tags)
                    ? data.tags.map((t) => ({ label: t, value: t }))
                    : [],
                brand: data.brand || '',
            }
        }

        return {}
    }

    const handleFormSubmit = async (values) => {
        setIsSubmiting(true)
        try {
            const res = await fetch(`/api/products/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || 'Failed to save product')
            }
            toast.push(
                <Notification type="success">Changes Saved!</Notification>,
                { placement: 'top-center' },
            )
            router.push('/concepts/products/product-list')
        } catch (err) {
            toast.push(
                <Notification type="danger">{err.message}</Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsSubmiting(false)
        }
    }

    const handleDelete = () => {
        setDeleteConfirmationOpen(true)
    }

    const handleCancel = () => {
        setDeleteConfirmationOpen(false)
    }

    const handleBack = () => {
        router.push('/concepts/products/product-list')
    }

    const handleConfirmDelete = async () => {
        try {
            const res = await fetch(`/api/products/${data.id}`, { method: 'DELETE' })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || 'Failed to delete product')
            }
            setDeleteConfirmationOpen(false)
            toast.push(
                <Notification type="success">Product deleted!</Notification>,
                { placement: 'top-center' },
            )
            router.push('/concepts/products/product-list')
        } catch (err) {
            toast.push(
                <Notification type="danger">{err.message}</Notification>,
                { placement: 'top-center' },
            )
        }
    }

    return (
        <>
            <ProductForm
                defaultValues={getDefaultValues()}
                newProduct={false}
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
            </ProductForm>
            <ConfirmDialog
                isOpen={deleteConfirmationOpen}
                type="danger"
                title="Remove product"
                onClose={handleCancel}
                onRequestClose={handleCancel}
                onCancel={handleCancel}
                onConfirm={handleConfirmDelete}
            >
                <p>
                    Are you sure you want to remove this product? This action
                    can&apos;t be undo.{' '}
                </p>
            </ConfirmDialog>
        </>
    )
}

export default ProductEdit
