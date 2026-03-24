'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import ChatBox from '@/components/view/ChatBox'
import ChatAction from './ChatAction'
import StartConverstation from '@/assets/svg/StartConverstation'
import { useChatStore } from '../_store/chatStore'
import { apiGetConversation, apiSendMessage } from '@/services/ChatService'
import classNames from '@/utils/classNames'
import useResponsive from '@/utils/hooks/useResponsive'
import dayjs from 'dayjs'
import { TbChevronLeft } from 'react-icons/tb'

const getFileType = (file) => {
    const mime = file.type || ''
    if (mime.startsWith('image/')) return 'image'
    if (mime.startsWith('video/')) return 'video'
    if (mime.startsWith('audio/')) return 'audio'
    return 'file'
}

const ChatBody = () => {
    const scrollRef = useRef(null)
    const selectedChat = useChatStore((state) => state.selectedChat)
    const conversationRecord = useChatStore((state) => state.conversationRecord)
    const pushConversationRecord = useChatStore(
        (state) => state.pushConversationRecord,
    )
    const setSelectedChat = useChatStore((state) => state.setSelectedChat)
    const pushConversationMessage = useChatStore(
        (state) => state.pushConversationMessage,
    )
    const setContactInfoDrawer = useChatStore(
        (state) => state.setContactInfoDrawer,
    )
    // eslint-disable-next-line no-unused-vars
    const [_, setIsFetchingConversation] = useState(false)
    const [conversation, setConversation] = useState([])

    const { smaller } = useResponsive()

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight
            }
        }, 100)
    }

    const handleProfileClick = () => {
        setContactInfoDrawer({
            userId: selectedChat.user?.id,
            chatId: selectedChat.id,
            chatType: selectedChat.chatType,
            open: true,
        })
    }

    const handlePushMessage = (message) => {
        // Only push to local state — zustand record will be stale but
        // gets refreshed on next conversation load. This avoids the
        // double-push when conversation state shares the record reference.
        setConversation((prev) => [...prev, message])
    }

    const handleInputChange = async ({ value, attachments }) => {
        // Upload attachments to DO Spaces first
        let uploadedAttachments = []
        if (attachments?.length > 0) {
            for (const file of attachments) {
                try {
                    const formData = new FormData()
                    formData.append('file', file)
                    formData.append('folder', 'chat')
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    })
                    const data = await res.json()
                    if (data.url) {
                        uploadedAttachments.push({
                            type: getFileType(file),
                            mediaUrl: data.url,
                            source: { name: file.name, size: file.size },
                        })
                    }
                } catch (err) {
                    console.error('Failed to upload attachment:', err)
                }
            }
        }

        const localAttachments = attachments?.map((attachment) => ({
            type: getFileType(attachment),
            mediaUrl: URL.createObjectURL(attachment),
        })) || uploadedAttachments

        // Optimistic local message
        const newMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            sender: {
                id: 'me',
                name: '',
                avatarImageUrl: '',
            },
            content: value,
            attachments: localAttachments.length > 0 ? localAttachments : uploadedAttachments,
            timestamp: Math.floor(Date.now() / 1000),
            type: 'regular',
            isMyMessage: true,
        }
        handlePushMessage(newMessage)
        scrollToBottom()

        // Persist to DB
        try {
            await apiSendMessage({
                id: selectedChat.id,
                content: value,
                type: uploadedAttachments.length > 0 ? 'image' : 'regular',
                attachments: uploadedAttachments,
            })
        } catch (err) {
            console.error('Failed to send message:', err)
        }
    }

    const cardHeaderProps = {
        header: {
            content: (
                <div className="flex items-center gap-2">
                    {smaller.md && (
                        <button
                            className="text-xl hover:text-primary"
                            onClick={() => setSelectedChat({})}
                        >
                            <TbChevronLeft />
                        </button>
                    )}
                    <button
                        className="flex items-center gap-2"
                        role="button"
                        onClick={handleProfileClick}
                    >
                        <div>
                            <Avatar src={selectedChat.user?.avatarImageUrl} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between">
                                <div className="font-bold heading-text truncate">
                                    {selectedChat.user?.name}
                                </div>
                            </div>
                            <div>
                                {selectedChat?.chatType === 'groups'
                                    ? 'click here for group info'
                                    : 'last seen recently'}
                            </div>
                        </div>
                    </button>
                </div>
            ),
            extra: <ChatAction muted={selectedChat.muted} />,
            className: 'bg-gray-100 dark:bg-gray-600 h-[100px]',
        },
    }

    useEffect(() => {
        const fetchConvesation = async () => {
            setIsFetchingConversation(true)

            // Always fetch fresh from DB to get latest messages
            const resp = await apiGetConversation({
                id: selectedChat.id,
            })
            setConversation(resp.conversation || [])

            setIsFetchingConversation(false)
            scrollToBottom()
        }

        if (selectedChat.id) {
            setConversation([])
            fetchConvesation()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat.id])

    const messageList = useMemo(() => {
        return conversation.map((item) => {
            const ts = typeof item.timestamp === 'number'
                ? dayjs.unix(item.timestamp).toDate()
                : item.timestamp
            return {
                ...item,
                timestamp: ts,
                showAvatar: item.isMyMessage ? false : item.showAvatar,
            }
        })
    }, [conversation])

    return (
        <div
            className={classNames(
                'w-full md:block',
                !selectedChat.id && 'hidden',
            )}
        >
            {selectedChat.id ? (
                <Card
                    className="flex-1 h-full max-h-full dark:border-gray-700"
                    bodyClass="h-[calc(100%-100px)] relative"
                    {...cardHeaderProps}
                >
                    <ChatBox
                        ref={scrollRef}
                        messageList={messageList}
                        placeholder="Enter a prompt here"
                        showAvatar={true}
                        avatarGap={true}
                        messageListClass="h-[calc(100%-100px)]"
                        bubbleClass="max-w-[300px]"
                        onInputChange={handleInputChange}
                    />
                </Card>
            ) : (
                <div className="flex-1 h-full max-h-full flex flex-col items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800">
                    <StartConverstation height={250} width={250} />
                    <div className="mt-10 text-center">
                        <h3>Start Chatting!</h3>
                        <p className="mt-2 text-base">
                            Pick a Conversation or Begin a New One
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ChatBody
