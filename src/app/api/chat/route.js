import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/chat — get chat list for current user
export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id

        const conversations = await prisma.chatConversation.findMany({
            where: { participantIds: { has: userId } },
            orderBy: { lastMessageTime: 'desc' },
        })

        // Build chat list in the shape the UI expects
        const chats = await Promise.all(
            conversations.map(async (conv) => {
                // For personal chats, find the other participant
                let name = conv.name
                let avatar = conv.avatar
                let odId = null

                if (conv.chatType === 'personal') {
                    const otherId = conv.participantIds.find((id) => id !== userId)
                    if (otherId) {
                        // Try User first, then Customer
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

        return NextResponse.json(chats)
    } catch (error) {
        console.error('GET /api/chat error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/chat — create a new conversation
export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const body = await request.json()
        const { participantIds = [], chatType = 'personal', name } = body

        // Ensure current user is in participants
        const allParticipants = [...new Set([userId, ...participantIds])]

        // For personal chats, check if conversation already exists
        if (chatType === 'personal' && allParticipants.length === 2) {
            const existing = await prisma.chatConversation.findFirst({
                where: {
                    chatType: 'personal',
                    participantIds: { hasEvery: allParticipants },
                },
            })
            if (existing) {
                return NextResponse.json({ id: existing.id, existing: true })
            }
        }

        const conversation = await prisma.chatConversation.create({
            data: {
                name: chatType === 'groups' ? (name || 'New Group') : null,
                chatType,
                participantIds: allParticipants,
            },
        })

        return NextResponse.json({ id: conversation.id, existing: false })
    } catch (error) {
        console.error('POST /api/chat error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
