import Avatar from '@/components/ui/Avatar'
import Attachment from './Attachment'
import classNames from '@/utils/classNames'

const urlRegex = /(https?:\/\/[^\s<>"]+)/g

const linkifyContent = (text) => {
    if (!text || typeof text !== 'string') return text
    const parts = text.split(urlRegex)
    if (parts.length === 1) return text
    return parts.map((part, i) => {
        if (urlRegex.test(part)) {
            urlRegex.lastIndex = 0
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                >
                    {part}
                </a>
            )
        }
        urlRegex.lastIndex = 0
        return part
    })
}

const Message = (props) => {
    const {
        attachments,
        content,
        showAvatar = true,
        avatarGap,
        isMyMessage,
        sender,
        type,
        customRenderer,
        customAction,
        bubbleClass,
    } = props

    return (
        <>
            {type === 'divider' ? (
                <></>
            ) : (
                <div
                    className={classNames('flex', isMyMessage && 'justify-end')}
                >
                    <div className="flex flex-col">
                        <div
                            className={classNames(
                                'inline-flex items-end gap-2',
                                isMyMessage && 'justify-end flex-row-reverse',
                            )}
                        >
                            {showAvatar && (
                                <div className={classNames('w-[35px]')}>
                                    {avatarGap && (
                                        <Avatar
                                            src={sender.avatarImageUrl}
                                            size={35}
                                        />
                                    )}
                                </div>
                            )}
                            <div
                                className={classNames(
                                    'bubble flex flex-col justify-center h-full max-w-[750px] rounded-xl px-5 py-2.5 bg-gray-100 dark:bg-gray-700 prose text-sm text-gray-900 dark:text-gray-100',
                                    bubbleClass,
                                )}
                            >
                                {customRenderer ? (
                                    customRenderer()
                                ) : (
                                    <>
                                        {attachments &&
                                            attachments?.length > 0 && (
                                                <Attachment
                                                    attachments={attachments}
                                                />
                                            )}
                                        {linkifyContent(content)}
                                    </>
                                )}
                            </div>
                        </div>
                        {customAction && (
                            <div>
                                <div
                                    className={classNames(
                                        'flex items-end gap-2',
                                        isMyMessage && ' flex-row-reverse',
                                    )}
                                >
                                    {showAvatar && avatarGap && (
                                        <div
                                            className={classNames('w-[35px]')}
                                        ></div>
                                    )}
                                    {customAction()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default Message
