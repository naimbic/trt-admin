import prisma from '@/lib/prisma'
import { auth } from '@/auth'

const getChatList = async () => {
    const session = await auth()
    if (!session?.user?.id) return []

    const userId = session.user.id

    const conversations = await prisma.chatConversation.findMany({
        where: { participantIds: { has: userId } },
        orderBy: { lastMessageTime: 'desc' },
    })

    const chats = await Promise.all(
        conversations.map(async (conv) => {
            let name = conv.name
            let avatar = conv.avatar
            let odId = null

            if (conv.chatType === 'personal') {
                const otherId = conv.participantIds.find((id) => id !== userId)
                if (otherId) {
                    let other = await prisma.user.findUnique({
                        where: { id: otherId },
                        select: { id: true, name: true, image: true },
                    })
                    if (!other) {
                        const cust = await prisma.customer.findUnique({
                            where: { id: otherId },
                            select: { id: true, firstName: true, lastName: true, image: true },
                        })
                        if (cust) {
                            other = {
                                id: cust.id,
                                name: `${cust.firstName} ${cust.lastName}`,
                                image: cust.image,
                            }
                        }
                    }
                    if (other) {
                        name = other.name
                        avatar = other.image || '/img/avatars/thumb-1.jpg'
                        odId = other.id
                    }
                }
            }

            return {
                id: conv.id,
                name: name || 'Unknown',
                userId: conv.chatType === 'personal' ? odId : undefined,
                groupId: conv.chatType === 'groups' ? conv.id : undefined,
                avatar: avatar || '/img/avatars/thumb-1.jpg',
                unread: 0,
                time: conv.lastMessageTime
                    ? Math.floor(conv.lastMessageTime.getTime() / 1000)
                    : 0,
                lastConversation: conv.lastMessage || '',
                chatType: conv.chatType,
                muted: false,
            }
        }),
    )

    return chats
}

export default getChatList
