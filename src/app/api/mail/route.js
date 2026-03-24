import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'
import { createNotification } from '@/lib/notify'

// GET /api/mail — get mail list with optional category/label filtering
export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const label = searchParams.get('label')
        const mailId = searchParams.get('mail')

        const userId = session.user.id

        // If requesting a single mail
        if (mailId) {
            const thread = await prisma.mailThread.findFirst({
                where: { id: mailId, ownerId: userId },
                include: { messages: { orderBy: { createdAt: 'asc' } } },
            })

            if (!thread) {
                return NextResponse.json({})
            }

            return NextResponse.json({
                id: thread.id,
                name: thread.name,
                from: thread.from,
                avatar: thread.avatar || '/img/avatars/thumb-1.jpg',
                title: thread.title,
                label: thread.label || '',
                group: thread.group,
                flagged: thread.flagged,
                starred: thread.starred,
                mail: thread.to,
                message: thread.messages.map((m) => ({
                    id: m.id,
                    name: m.name,
                    mail: m.to,
                    from: m.from,
                    avatar: m.avatar || '/img/avatars/thumb-1.jpg',
                    date: m.date,
                    content: m.content,
                    attachment: m.attachments || [],
                })),
            })
        }

        // Build filter
        const where = { ownerId: userId }

        if (label) {
            where.label = label
        } else if (category && category !== 'inbox') {
            where.group = category
        } else {
            // inbox = no group or group is empty/inbox
            where.group = { in: ['inbox', ''] }
        }

        const threads = await prisma.mailThread.findMany({
            where,
            include: { messages: { orderBy: { createdAt: 'asc' } } },
            orderBy: { updatedAt: 'desc' },
        })

        const mailList = threads.map((thread) => ({
            id: thread.id,
            name: thread.name,
            from: thread.from,
            avatar: thread.avatar || '/img/avatars/thumb-1.jpg',
            title: thread.title,
            label: thread.label || '',
            group: thread.group,
            flagged: thread.flagged,
            starred: thread.starred,
            mail: thread.to,
            message: thread.messages.map((m) => ({
                id: m.id,
                name: m.name,
                mail: m.to,
                from: m.from,
                avatar: m.avatar || '/img/avatars/thumb-1.jpg',
                date: m.date,
                content: m.content,
                attachment: m.attachments || [],
            })),
        }))

        return NextResponse.json(mailList)
    } catch (error) {
        console.error('GET /api/mail error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/mail — send a new mail (creates sentItem for sender + inbox for recipient)
export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const body = await request.json()
        const { to, title, content, attachments } = body

        const sender = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true, image: true },
        })

        const senderName = sender?.name || 'Unknown'
        const senderEmail = sender?.email || 'noreply@trtdigital.ma'
        const senderAvatar = sender?.image || '/img/avatars/thumb-1.jpg'
        const dateStr = new Date().toLocaleString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })
        const subject = title || '(No subject)'

        const messageData = {
            name: senderName,
            from: senderEmail,
            avatar: senderAvatar,
            content: content || '',
            to: [to],
            date: dateStr,
            attachments: attachments || [],
        }

        // 1. Create sentItem thread for sender
        const sentThread = await prisma.mailThread.create({
            data: {
                name: senderName,
                from: senderEmail,
                avatar: senderAvatar,
                title: subject,
                label: '',
                group: 'sentItem',
                to: [to],
                ownerId: userId,
                messages: { create: messageData },
            },
        })

        // 2. Find recipient by email (User or Customer) and create inbox thread
        const recipientUser = await prisma.user.findUnique({
            where: { email: to },
            select: { id: true },
        })

        const recipientId = recipientUser?.id

        if (recipientId) {
            await prisma.mailThread.create({
                data: {
                    name: senderName,
                    from: senderEmail,
                    avatar: senderAvatar,
                    title: subject,
                    label: '',
                    group: 'inbox',
                    to: [to],
                    ownerId: recipientId,
                    messages: { create: messageData },
                },
            })
            createNotification(recipientId, senderName, `sent you an email: "${subject}"`, 'info', `/concepts/mail`)
        }

        return NextResponse.json({ id: sentThread.id, success: true })
    } catch (error) {
        console.error('POST /api/mail error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
