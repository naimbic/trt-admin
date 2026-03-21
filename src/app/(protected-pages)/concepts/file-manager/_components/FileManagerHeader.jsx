'use client'
import { Fragment, useState } from 'react'
import Segment from '@/components/ui/Segment'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import UploadFile from './UploadFile'
import { useFileManagerStore } from '../_store/useFileManagerStore'
import { apiCreateFolder } from '@/services/FileService'
import { TbChevronRight, TbLayoutGrid, TbList, TbFolderPlus } from 'react-icons/tb'

const NewFolderButton = ({ onCreated }) => {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const { openedDirectoryId } = useFileManagerStore()

    const handleCreate = async () => {
        if (!name.trim()) return
        setLoading(true)
        try {
            await apiCreateFolder({
                action: 'createFolder',
                name: name.trim(),
                folder: openedDirectoryId || undefined,
            })
            setOpen(false)
            setName('')
            onCreated?.()
        } catch (e) {
            console.error('Create folder error:', e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Button icon={<TbFolderPlus />} onClick={() => setOpen(true)}>
                New Folder
            </Button>
            <Dialog isOpen={open} onClose={() => setOpen(false)} onRequestClose={() => setOpen(false)}>
                <h4>New Folder</h4>
                <div className="mt-4">
                    <Input
                        placeholder="Folder name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <Button size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button size="sm" variant="solid" loading={loading} disabled={!name.trim()} onClick={handleCreate}>
                        Create
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

const FileManagerHeader = ({ onEntryClick, onDirectoryClick, onRefresh }) => {
    const { directories, layout, setLayout } = useFileManagerStore()

    const handleEntryClick = () => {
        onEntryClick()
    }

    const handleDirectoryClick = (id) => {
        onDirectoryClick(id)
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                {directories.length > 0 ? (
                    <div className="flex items-center gap-2">
                        <h3 className="flex items-center gap-2 text-base sm:text-2xl">
                            <span
                                className="hover:text-primary cursor-pointer"
                                role="button"
                                onClick={handleEntryClick}
                            >
                                File Manager
                            </span>
                            {directories.map((dir, index) => (
                                <Fragment key={dir.id}>
                                    <TbChevronRight className="text-lg" />
                                    {directories.length - 1 === index ? (
                                        <span>{dir.label}</span>
                                    ) : (
                                        <span
                                            className="hover:text-primary cursor-pointer"
                                            role="button"
                                            onClick={() =>
                                                handleDirectoryClick(dir.id)
                                            }
                                        >
                                            {dir.label}
                                        </span>
                                    )}
                                </Fragment>
                            ))}
                        </h3>
                    </div>
                ) : (
                    <h3>File Manager</h3>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Segment value={layout} onChange={(val) => setLayout(val)}>
                    <Segment.Item value="grid" className="text-xl px-3">
                        <TbLayoutGrid />
                    </Segment.Item>
                    <Segment.Item value="list" className="text-xl px-3">
                        <TbList />
                    </Segment.Item>
                </Segment>
                <UploadFile onUploaded={onRefresh} />
                <NewFolderButton onCreated={onRefresh} />
            </div>
        </div>
    )
}

export default FileManagerHeader
