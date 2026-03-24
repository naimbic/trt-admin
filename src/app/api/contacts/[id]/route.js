import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/contacts/[id] — get contact details for drawer
// Helper: extract media/files/links from conversation messages
async function extractMedia(conversationId) {
    if (!conversationId) return { images: [], files: [], links: [] }
    const messages = await prisma.chatMessage.findMany({
        where: { conversationId },
        select: { id: true, content: true, attachments: true },
        orderBy: { date: 'desc' },
    })

    const images = []
    const files = []
    const links = []
    const urlRegex = /https?:\/\/[^\s<>"]+/g

    for (const msg of messages) {
        // Extract attachments
        if (msg.attachments?.length > 0) {
            for (const att of msg.attachments) {
                if (att.type === 'image') {
                    images.push({ id: msg.id + att.mediaUrl, url: att.mediaUrl })
                } else {
                    const name = att.source?.name || att.mediaUrl?.split('/').pop() || 'File'
                    const ext = name.split('.').pop()?.toLowerCase() || 'file'
                    files.push({ id: msg.id + att.mediaUrl, name, fileType: ext, size: att.source?.size || 0, url: att.mediaUrl })
                }
            }
        }
        // Extract links from message content
        const found = msg.content?.match(urlRegex) || []
        for (const url of found) {
            const domain = url.replace(/https?:\/\//, '').split('/')[0]
            links.push({ id: msg.id + url, url, title: domain, description: url, favicon: `https://www.google.com/s2/favicons?domain=${domain}` })
        }
    }
    return { images, files, links }
}

async function getConversationMedia(userId, contactId) {
    // Find personal conversation between user and contact
    const conv = await prisma.chatConversation.findFirst({
        where: {
            chatType: 'personal',
            participantIds: { hasEvery: [userId, contactId] },
        },
        select: { id: true },
    })
    return extractMedia(conv?.id)
}

async function getConversationMediaById(conversationId) {
    return extractMedia(conversationId)
}

export async function GET(_, { params }) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Try User first
        let user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true, name: true, email: true, image: true,
                phone: true, dialCode: true, lastOnline: true, title: true,
                role: true,
            },
        })

        if (user) {
            // Find personal conversation to extract media
            const media = await getConversationMedia(userId, id)
            return NextResponse.json({
                userDetails: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    img: user.image || '/img/avatars/thumb-1.jpg',
                    title: user.title || user.role || 'Staff',
                    lastOnline: user.lastOnline || Math.floor(Date.now() / 1000),
                    personalInfo: {
                        phoneNumber: user.dialCode
                            ? `${user.dialCode} ${user.phone || ''}`
                            : user.phone || 'N/A',
                    },
                },
                media,
            })
        }

        // Try Customer
        const customer = await prisma.customer.findUnique({
            where: { id },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                image: true, phone: true, dialCode: true,
            },
        })

        if (customer) {
            const media = await getConversationMedia(userId, id)
            return NextResponse.json({
                userDetails: {
                    id: customer.id,
                    name: `${customer.firstName} ${customer.lastName}`,
                    email: customer.email,
                    img: customer.image || '/img/avatars/thumb-1.jpg',
                    title: 'Client',
                    lastOnline: Math.floor(Date.now() / 1000),
                    personalInfo: {
                        phoneNumber: customer.dialCode
                            ? `${customer.dialCode} ${customer.phone || ''}`
                            : customer.phone || 'N/A',
                    },
                },
                media,
            })
        }

        // Try as group conversation
        const conv = await prisma.chatConversation.findUnique({
            where: { id },
        })

        if (conv && conv.chatType === 'groups') {
            const memberDetails = await Promise.all(
                conv.participantIds.map(async (pid) => {
                    const u = await prisma.user.findUnique({
                        where: { id: pid },
                        select: { id: true, name: true, image: true, email: true },
                    })
                    if (u) return { id: u.id, name: u.name, img: u.image || '/img/avatars/thumb-1.jpg', email: u.email }
                    const c = await prisma.customer.findUnique({
                        where: { id: pid },
                        select: { id: true, firstName: true, lastName: true, image: true, email: true },
                    })
                    if (c) return { id: c.id, name: `${c.firstName} ${c.lastName}`, img: c.image || '/img/avatars/thumb-1.jpg', email: c.email }
                    return null
                }),
            )

            const media = await getConversationMediaById(id)
            return NextResponse.json({
                userDetails: {
                    id: conv.id,
                    name: conv.name || 'Group',
                    img: conv.avatar || '/img/others/img-19.jpg',
                    members: memberDetails.filter(Boolean),
                },
                media,
            })
        }

        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    } catch (error) {
        console.error('GET /api/contacts/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
