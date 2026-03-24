import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { createNotification } from '@/lib/notify'

// GET /api/chat/[id] — get conversation messages
export async function GET(_, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const userId = session.user.id

        const conversation = await prisma.chatConversation.findUnique({
            where: { id },
            include: {
                messages: { orderBy: { date: 'asc' } },
            },
        })

        if (!conversation) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        // Map messages to the shape ChatBody expects
        const messages = conversation.messages.map((msg) => ({
            id: msg.id,
            sender: {
                id: msg.senderId,
                name: msg.senderName || 'Unknown',
                avatarImageUrl: msg.senderAvatar || '/img/avatars/thumb-1.jpg',
            },
            content: msg.content,
            timestamp: Math.floor(msg.date.getTime() / 1000),
            type: msg.type,
            isMyMessage: msg.senderId === userId,
            attachments: msg.attachments || [],
        }))

        return NextResponse.json({ id: conversation.id, conversation: messages })
    } catch (error) {
        console.error('GET /api/chat/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/chat/[id] — send a message
export async function POST(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const userId = session.user.id
        const body = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, image: true },
        })

        const message = await prisma.chatMessage.create({
            data: {
                conversationId: id,
                senderId: userId,
                senderName: user?.name || 'Unknown',
                senderAvatar: user?.image || '/img/avatars/thumb-1.jpg',
                content: body.content || '',
                type: body.type || 'regular',
                attachments: body.attachments || [],
            },
        })

        // Update conversation last message
        await prisma.chatConversation.update({
            where: { id },
            data: {
                lastMessage: body.content || '',
                lastMessageTime: message.date,
            },
        })

        // Notify other participants
        const conv = await prisma.chatConversation.findUnique({
            where: { id },
            select: { participantIds: true },
        })
        if (conv) {
            const others = conv.participantIds.filter((pid) => pid !== userId)
            for (const pid of others) {
                createNotification(pid, user?.name || 'Someone', `sent you a message: "${(body.content || '').substring(0, 60)}"`, 'info', `/concepts/chat`)
            }
        }

        return NextResponse.json({
            id: message.id,
            sender: {
                id: userId,
                name: user?.name || 'Unknown',
                avatarImageUrl: user?.image || '/img/avatars/thumb-1.jpg',
            },
            content: message.content,
            timestamp: Math.floor(message.date.getTime() / 1000),
            type: message.type,
            isMyMessage: true,
            attachments: message.attachments || [],
        })
    } catch (error) {
        console.error('POST /api/chat/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/chat/[id] — permanently delete conversation and its messages
export async function DELETE(_, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Delete all messages first, then the conversation
        await prisma.chatMessage.deleteMany({ where: { conversationId: id } })
        await prisma.chatConversation.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/chat/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
export async function PUT(request, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()

        const conv = await prisma.chatConversation.findUnique({ where: { id } })
        if (!conv) {
            return NextResponse.json({ error: 'Not found' }, { status: 404 })
        }

        const data = {}

        // Add members
        if (body.addMembers?.length > 0) {
            const current = new Set(conv.participantIds)
            body.addMembers.forEach((mid) => current.add(mid))
            data.participantIds = [...current]
        }

        // Remove members
        if (body.removeMembers?.length > 0) {
            const removeSet = new Set(body.removeMembers)
            const current = data.participantIds || conv.participantIds
            data.participantIds = current.filter((pid) => !removeSet.has(pid))
        }

        // Update name
        if (body.name !== undefined) {
            data.name = body.name
        }

        const updated = await prisma.chatConversation.update({
            where: { id },
            data,
        })

        return NextResponse.json({ id: updated.id, participantIds: updated.participantIds, name: updated.name })
    } catch (error) {
        console.error('PUT /api/chat/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
