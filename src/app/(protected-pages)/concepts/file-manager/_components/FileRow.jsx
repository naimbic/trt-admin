'use client'
import Table from '@/components/ui/Table'
import FileType from './FileType'
import FileItemDropdown from './FileItemDropdown'
import fileSizeUnit from '@/utils/fileSizeUnit'
import FileIcon from '@/components/view/FileIcon'

const { Tr, Td } = Table

const FileRow = (props) => {
    const { fileType, size, name, srcUrl, onClick, onOpen, ...rest } = props

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
        <Tr>
            <Td width="70%">
                <div
                    className="inline-flex items-center gap-2 cursor-pointer group"
                    role="button"
                    onClick={handleClick}
                >
                    {isImage && srcUrl ? (
                        <img
                            src={srcUrl}
                            alt={name}
                            className="w-8 h-8 rounded object-cover"
                        />
                    ) : (
                        <div className="text-3xl">
                            <FileIcon type={fileType || ''} />
                        </div>
                    )}
                    <div className="font-bold heading-text group-hover:text-primary">
                        {name}
                    </div>
                </div>
            </Td>
            <Td>{fileSizeUnit(size || 0)}</Td>
            <Td>
                <FileType type={fileType || ''} />
            </Td>
            <Td>
                <div className="flex justify-end">
                    <FileItemDropdown onOpen={onOpen} {...rest} />
                </div>
            </Td>
        </Tr>
    )
}

export default FileRow
