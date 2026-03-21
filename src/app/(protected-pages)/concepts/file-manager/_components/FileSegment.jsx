'use client'
import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import MediaSkeleton from '@/components/shared/loaders/MediaSkeleton'
import FileIcon from '@/components/view/FileIcon'

const FileSegment = (props) => {
    const { fileType, size, name, srcUrl, onClick, loading, onOpen, ...rest } = props

    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(fileType)
    const isFolder = fileType === 'directory'

    const handleClick = () => {
        if (isFolder && onOpen) {
            onOpen()
        } else {
            onClick?.()
        }
    }

    return (
        <div
            className="bg-white rounded-2xl dark:bg-gray-800 border border-gray-200 dark:border-transparent py-4 px-3.5 flex flex-col transition-all hover:shadow-[0_0_1rem_0.25rem_rgba(0,0,0,0.04),0px_2rem_1.5rem_-1rem_rgba(0,0,0,0.12)] cursor-pointer"
            role="button"
            onClick={handleClick}
        >
            {loading ? (
                <MediaSkeleton
                    avatarProps={{
                        width: 33,
                        height: 33,
                    }}
                />
            ) : (
                <>
                    {isImage && srcUrl ? (
                        <div className="mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center" style={{ height: 140 }}>
                            <img
                                src={srcUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="text-3xl shrink-0">
                                <FileIcon type={fileType || ''} />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold heading-text truncate">{name}</div>
                                <span className="text-xs">
                                    {fileSizeUnit(size || 0)}
                                </span>
                            </div>
                        </div>
                        <FileItemDropdown onOpen={onOpen} {...rest} />
                    </div>
                </>
            )}
        </div>
    )
}

export default FileSegment
