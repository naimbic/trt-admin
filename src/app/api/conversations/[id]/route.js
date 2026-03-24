import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

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
        console.error('GET /api/conversations/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
