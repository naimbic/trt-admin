import fileSizeUnit from '@/utils/fileSizeUnit'
import { TbFile, TbDownload, TbExternalLink, TbPhoto, TbVideo, TbMusic, TbFileTypePdf, TbFileSpreadsheet, TbFileText, TbFileZip } from 'react-icons/tb'

const getFileIcon = (type, name) => {
    if (type === 'image') return <TbPhoto className="text-2xl text-blue-500" />
    if (type === 'video') return <TbVideo className="text-2xl text-purple-500" />
    if (type === 'audio') return <TbMusic className="text-2xl text-green-500" />
    const ext = name?.split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf') return <TbFileTypePdf className="text-2xl text-red-500" />
    if (['xls', 'xlsx', 'csv'].includes(ext)) return <TbFileSpreadsheet className="text-2xl text-emerald-500" />
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) return <TbFileText className="text-2xl text-blue-500" />
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <TbFileZip className="text-2xl text-amber-500" />
    return <TbFile className="text-2xl heading-text" />
}

const getFileName = (url) => {
    if (!url) return 'File'
    const parts = url.split('/')
    const last = parts[parts.length - 1]
    // Remove hash prefix (userId-hash.ext) for cleaner display
    const dotIdx = last.lastIndexOf('.')
    if (dotIdx > 0) {
        return last.substring(last.indexOf('-', last.indexOf('-') + 1) + 1) || last
    }
    return last
}

const Attachment = ({ attachments }) => {
    return (
        <div className="flex flex-col gap-1">
            {attachments &&
                attachments.map((attachment, index) => {
                    const key = attachment.mediaUrl + index
                    const fileName = attachment.source?.name || getFileName(attachment.mediaUrl)

                    if (attachment.type === 'image') {
                        return (
                            <div key={key} className="relative group">
                                <img
                                    className="rounded-xl my-1 max-w-full"
                                    src={attachment.mediaUrl}
                                    alt={fileName}
                                />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={attachment.mediaUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                                        title="Open"
                                    >
                                        <TbExternalLink className="text-sm" />
                                    </a>
                                    <a
                                        href={attachment.mediaUrl}
                                        download={fileName}
                                        className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                                        title="Download"
                                    >
                                        <TbDownload className="text-sm" />
                                    </a>
                                </div>
                            </div>
                        )
                    }

                    if (attachment.type === 'video') {
                        return (
                            <div key={key} className="relative group my-1">
                                <video
                                    className="rounded-xl max-w-full"
                                    src={attachment.mediaUrl}
                                    controls
                                />
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a
                                        href={attachment.mediaUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                                        title="Open"
                                    >
                                        <TbExternalLink className="text-sm" />
                                    </a>
                                    <a
                                        href={attachment.mediaUrl}
                                        download={fileName}
                                        className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                                        title="Download"
                                    >
                                        <TbDownload className="text-sm" />
                                    </a>
                                </div>
                            </div>
                        )
                    }

                    if (attachment.type === 'audio') {
                        return (
                            <div key={key} className="my-1">
                                <audio controls className="max-w-full">
                                    <source src={attachment.mediaUrl} />
                                </audio>
                                <div className="flex gap-1 mt-1">
                                    <a
                                        href={attachment.mediaUrl}
                                        download={fileName}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                        <TbDownload className="text-xs" /> Download
                                    </a>
                                </div>
                            </div>
                        )
                    }

                    // Generic file (pdf, doc, zip, etc.)
                    return (
                        <a
                            key={key}
                            href={attachment.mediaUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-300 dark:border-gray-600 min-w-[250px] bg-white dark:bg-gray-600 my-1 no-underline hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                        >
                            {getFileIcon(attachment.type, fileName)}
                            <div className="flex-1 min-w-0">
                                <div className="heading-text font-bold text-sm truncate">
                                    {fileName}
                                </div>
                                {attachment.source?.size && (
                                    <div className="text-xs text-gray-500">
                                        {fileSizeUnit(attachment.source.size)}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-1">
                                <span className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title="Open">
                                    <TbExternalLink className="text-base heading-text" />
                                </span>
                                <span
                                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                    title="Download"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        const a = document.createElement('a')
                                        a.href = attachment.mediaUrl
                                        a.download = fileName
                                        a.click()
                                    }}
                                >
                                    <TbDownload className="text-base heading-text" />
                                </span>
                            </div>
                        </a>
                    )
                })}
        </div>
    )
}

export default Attachment
