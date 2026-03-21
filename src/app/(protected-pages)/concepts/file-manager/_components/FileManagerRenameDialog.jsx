'use client'

import { useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import { apiRenameFile } from '@/services/FileService'

const FileManagerRenameDialog = ({ onRenamed }) => {
    const { renameDialog, setRenameDialog, renameFile } = useFileManagerStore()
    const [newName, setNewName] = useState('')
    const [loading, setLoading] = useState(false)

    const handleDialogClose = () => {
        setRenameDialog({ id: '', open: false })
        setNewName('')
    }

    const handleSubmit = async () => {
        if (!newName.trim()) return
        setLoading(true)
        try {
            await apiRenameFile({ id: renameDialog.id, name: newName.trim() })
            renameFile({ id: renameDialog.id, fileName: newName.trim() })
            handleDialogClose()
            toast.push(
                <Notification title="File renamed" type="success" />,
                { placement: 'top-center' },
            )
            onRenamed?.()
        } catch (err) {
            toast.push(
                <Notification title="Rename failed" type="danger" />,
                { placement: 'top-center' },
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog
            isOpen={renameDialog.open}
            contentClassName="mt-[50%]"
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4>Rename</h4>
            <div className="mt-6">
                <Input
                    placeholder="New name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
            </div>
            <div className="mt-6 flex justify-end items-center gap-2">
                <Button size="sm" onClick={handleDialogClose}>
                    Close
                </Button>
                <Button
                    variant="solid"
                    size="sm"
                    loading={loading}
                    disabled={newName.length === 0}
                    onClick={handleSubmit}
                >
                    <span className="flex justify-center min-w-10">Ok</span>
                </Button>
            </div>
        </Dialog>
    )
}

export default FileManagerRenameDialog
