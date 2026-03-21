'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Upload from '@/components/ui/Upload'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import UploadMedia from '@/assets/svg/UploadMedia'
import { useFileManagerStore } from '../_store/useFileManagerStore'

const UploadFile = ({ onUploaded }) => {
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [pendingFiles, setPendingFiles] = useState([])
    const { openedDirectoryId } = useFileManagerStore()

    const handleUploadDialogClose = () => {
        setUploadDialogOpen(false)
        setPendingFiles([])
    }

    const handleUpload = async () => {
        if (pendingFiles.length === 0) return
        setIsUploading(true)

        try {
            for (const file of pendingFiles) {
                const form = new FormData()
                form.append('file', file)
                form.append('folder', 'files')
                form.append('saveToDb', 'true')
                if (openedDirectoryId) {
                    form.append('parentFolder', openedDirectoryId)
                }
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: form,
                })
                const json = await res.json()
                if (!json.success) {
                    throw new Error(json.error || 'Upload failed')
                }
            }
            handleUploadDialogClose()
            toast.push(
                <Notification title="Upload complete" type="success" />,
                { placement: 'top-center' },
            )
            onUploaded?.()
        } catch (err) {
            toast.push(
                <Notification title="Upload failed" type="danger">
                    {err.message}
                </Notification>,
                { placement: 'top-center' },
            )
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <Button variant="solid" onClick={() => setUploadDialogOpen(true)}>
                Upload
            </Button>
            <Dialog
                isOpen={uploadDialogOpen}
                onClose={handleUploadDialogClose}
                onRequestClose={handleUploadDialogClose}
            >
                <h4>Upload Files</h4>
                <Upload
                    draggable
                    multiple
                    className="mt-6 bg-gray-100 dark:bg-transparent"
                    onChange={setPendingFiles}
                    onFileRemove={setPendingFiles}
                >
                    <div className="my-4 text-center">
                        <div className="text-6xl mb-4 flex justify-center">
                            <UploadMedia height={150} width={200} />
                        </div>
                        <p className="font-semibold">
                            <span className="text-gray-800 dark:text-white">
                                Drop your files here, or{' '}
                            </span>
                            <span className="text-blue-500">browse</span>
                        </p>
                        <p className="mt-1 font-semibold opacity-60 dark:text-white">
                            Max 10MB per file
                        </p>
                    </div>
                </Upload>
                <div className="mt-4">
                    <Button
                        block
                        loading={isUploading}
                        variant="solid"
                        disabled={pendingFiles.length === 0}
                        onClick={handleUpload}
                    >
                        Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ''}
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default UploadFile
