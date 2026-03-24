'use client'
import { useEffect, useState, useRef } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import RichTextEditor from '@/components/shared/RichTextEditor'
import { useMailStore } from '../_store/mailStore'
import { FormItem, Form } from '@/components/ui/Form'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TbPaperclip, TbX } from 'react-icons/tb'

const validationSchema = z.object({
    to: z.string().min(1, { message: 'Please enter recipient' }),
    title: z.string().optional(),
    content: z.string().min(1, { message: 'Please enter message' }),
})

const MailEditor = () => {
    const { mail, messageDialog, toggleMessageDialog } = useMailStore()

    const [formSubmiting, setFormSubmiting] = useState(false)
    const [attachments, setAttachments] = useState([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const {
        handleSubmit,
        reset,
        formState: { errors },
        control,
    } = useForm({
        resolver: zodResolver(validationSchema),
    })

    useEffect(() => {
        if (messageDialog.mode === 'reply') {
            reset({
                to: mail.from,
                title: `Re:${mail.title}`,
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageDialog.mode])

    const handleDialogClose = () => {
        toggleMessageDialog({
            mode: '',
            open: false,
        })
        reset({
            to: '',
            title: '',
            content: '',
        })
        setAttachments([])
    }

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        setUploading(true)
        try {
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', 'mail-attachments')
                const res = await fetch('/api/upload', { method: 'POST', body: formData })
                const data = await res.json()
                if (data.url) {
                    setAttachments((prev) => [
                        ...prev,
                        { file: file.name, size: file.size, type: file.type, url: data.url },
                    ])
                }
            }
        } catch (err) {
            console.error('File upload failed:', err)
            toast.push(<Notification type="danger">File upload failed</Notification>, { placement: 'top-center' })
        }
        setUploading(false)
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const removeAttachment = (index) => {
        setAttachments((prev) => prev.filter((_, i) => i !== index))
    }

    const onSubmit = async (value) => {
        setFormSubmiting(true)
        try {
            await fetch('/api/mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: value.to,
                    title: value.title,
                    content: value.content,
                    attachments,
                }),
            })
            toast.push(<Notification type="success">Mail sent!</Notification>, {
                placement: 'top-center',
            })
        } catch (err) {
            console.error('Failed to send mail:', err)
            toast.push(<Notification type="danger">Failed to send mail</Notification>, {
                placement: 'top-center',
            })
        }
        setFormSubmiting(false)
        handleDialogClose()
    }

    return (
        <Dialog
            isOpen={messageDialog.open}
            onClose={handleDialogClose}
            onRequestClose={handleDialogClose}
        >
            <h4 className="mb-4">
                {messageDialog.mode === 'new' && 'New Message'}
                {messageDialog.mode === 'reply' && 'Reply'}
            </h4>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <FormItem
                    label="Title:"
                    invalid={Boolean(errors.title)}
                    errorMessage={errors.title?.message}
                >
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Input
                                autoComplete="off"
                                placeholder="Add a subject"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="To:"
                    invalid={Boolean(errors.to)}
                    errorMessage={errors.to?.message}
                >
                    <Controller
                        name="to"
                        control={control}
                        render={({ field }) => (
                            <Input autoComplete="off" {...field} />
                        )}
                    />
                </FormItem>
                <FormItem
                    label="Message"
                    invalid={Boolean(errors.content)}
                    errorMessage={errors.content?.message}
                >
                    <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor
                                content={field.value}
                                invalid={Boolean(errors.content)}
                                onChange={({ html }) => {
                                    field.onChange(html)
                                }}
                            />
                        )}
                    />
                </FormItem>
                {/* Attachments */}
                <div className="mt-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <Button
                        size="sm"
                        variant="plain"
                        type="button"
                        icon={<TbPaperclip />}
                        loading={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? 'Uploading...' : 'Attach files'}
                    </Button>
                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {attachments.map((att, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-xs"
                                >
                                    <span className="max-w-[150px] truncate">{att.file}</span>
                                    <button
                                        type="button"
                                        className="text-gray-400 hover:text-red-500"
                                        onClick={() => removeAttachment(idx)}
                                    >
                                        <TbX />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="text-right mt-4">
                    <Button
                        className="ltr:mr-2 rtl:ml-2"
                        variant="plain"
                        type="button"
                        onClick={handleDialogClose}
                    >
                        Discard
                    </Button>
                    <Button
                        variant="solid"
                        loading={formSubmiting}
                        type="submit"
                    >
                        Send
                    </Button>
                </div>
            </Form>
        </Dialog>
    )
}

export default MailEditor
