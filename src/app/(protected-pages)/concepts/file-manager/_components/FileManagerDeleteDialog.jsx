'use client'

import { useState } from 'react'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import { apiDeleteFile } from '@/services/FileService'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'

const FileManagerDeleteDialog = ({ onDeleted }) => {
    const { deleteDialog, setDeleteDialog, deleteFile } = useFileManagerStore()
    const [loading, setLoading] = useState(false)

    const handleDeleteDialogClose = () => {
        setDeleteDialog({ id: '', open: false })
    }

    const handleDeleteConfirm = async () => {
        setLoading(true)
        try {
            await apiDeleteFile(deleteDialog.id)
            deleteFile(deleteDialog.id)
            setDeleteDialog({ id: '', open: false })
            toast.push(
                <Notification title="File deleted" type="success" />,
                { placement: 'top-center' },
            )
            onDeleted?.()
        } catch (err) {
            toast.push(
                <Notification title="Delete failed" type="danger" />,
                { placement: 'top-center' },
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <ConfirmDialog
            isOpen={deleteDialog.open}
            type="danger"
            title="Delete file"
            confirmButtonProps={{ loading }}
            onClose={handleDeleteDialogClose}
            onRequestClose={handleDeleteDialogClose}
            onCancel={handleDeleteDialogClose}
            onConfirm={handleDeleteConfirm}
        >
            <p>
                Are you sure you want to delete this file? This action
                can&apos;t be undone.
            </p>
        </ConfirmDialog>
    )
}

export default FileManagerDeleteDialog
