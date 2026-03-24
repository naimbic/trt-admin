'use client'
import IconText from '@/components/shared/IconText'
import Avatar from '@/components/ui/Avatar'
import ScrollBar from '@/components/ui/ScrollBar'
import FileIcon from '@/components/view/FileIcon'
import classNames from '@/utils/classNames'
import isLastChild from '@/utils/isLastChild'
import ReactHtmlParser from 'html-react-parser'
import { useMailStore } from '../_store/mailStore'
import { HiOutlineClock } from 'react-icons/hi'
import { TbDownload, TbExternalLink, TbArrowBackUp } from 'react-icons/tb'

const formatSize = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return bytes || ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (item) => {
    if (item.type?.startsWith('image/')) return true
    const ext = item.file?.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

const handleDownload = async (url, filename) => {
    try {
        const res = await fetch(url)
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = filename || 'download'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(blobUrl)
    } catch {
        window.open(url, '_blank')
    }
}

const MailDetailContent = (props) => {
    const { mail = {}, ref } = props
    const { toggleMessageDialog } = useMailStore()

    const handleReply = (msg) => {
        toggleMessageDialog({
            mode: 'reply',
            open: true,
        })
    }

    return (
        <div className="absolute top-0 left-0 h-full w-full ">
            <ScrollBar
                ref={ref}
                autoHide
                className="overflow-y-auto h-[calc(100%-100px)]"
            >
                <div className="h-full px-6">
                    {mail.message?.map((msg, index) => (
                        <div key={msg.id}>
                            <div
                                className={classNames(
                                    'py-8 ltr:pr-4 rtl:pl-4',
                                    !isLastChild(mail.message, index) &&
                                        'border-b border-gray-200 dark:border-gray-700',
                                )}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            shape="circle"
                                            src={msg.avatar}
                                        />
                                        <div>
                                            <div className="font-bold truncate heading-text">
                                                {msg.name}
                                            </div>
                                            <div>
                                                To:{' '}
                                                {mail.mail?.map((to, i) => (
                                                    <span key={to + i}>
                                                        {to}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <IconText
                                            icon={
                                                <HiOutlineClock className="text-lg" />
                                            }
                                        >
                                            <span className="font-semibold">
                                                {msg.date}
                                            </span>
                                        </IconText>
                                        <button
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary transition-colors"
                                            title="Reply"
                                            onClick={() => handleReply(msg)}
                                        >
                                            <TbArrowBackUp className="text-lg" />
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    {ReactHtmlParser(msg.content)}
                                </div>
                                {msg.attachment?.length > 0 && (
                                    <div className="mt-6 flex flex-wrap gap-4">
                                        {msg.attachment.map((item, idx) => (
                                            <div key={item.file || item.url || idx}>
                                                {isImage(item) && item.url ? (
                                                    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-[280px]">
                                                        <img
                                                            src={item.url}
                                                            alt={item.file || 'attachment'}
                                                            className="max-h-[200px] w-auto object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                            <a
                                                                href={item.url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
                                                                title="Open"
                                                            >
                                                                <TbExternalLink className="text-lg" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
                                                                title="Download"
                                                                onClick={() => handleDownload(item.url, item.file)}
                                                            >
                                                                <TbDownload className="text-lg" />
                                                            </button>
                                                        </div>
                                                        <div className="px-3 py-2 text-xs text-gray-500 truncate">{item.file}</div>
                                                    </div>
                                                ) : (
                                                    <div className="min-w-full md:min-w-[280px] rounded-2xl dark:bg-gray-800 border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 dark:border-gray-700 py-4 px-3.5 flex items-center gap-3 transition-all">
                                                        <FileIcon type={item.type?.split('/').pop() || 'file'} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                {item.file}
                                                            </div>
                                                            <span className="text-xs text-gray-500">
                                                                {typeof item.size === 'number' ? formatSize(item.size) : item.size}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            {item.url && (
                                                                <>
                                                                    <a
                                                                        href={item.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-primary transition-colors"
                                                                        title="Open"
                                                                    >
                                                                        <TbExternalLink className="text-base" />
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-primary transition-colors"
                                                                        title="Download"
                                                                        onClick={() => handleDownload(item.url, item.file)}
                                                                    >
                                                                        <TbDownload className="text-base" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollBar>
        </div>
    )
}

export default MailDetailContent
