import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ADMIN_ID = '69be00e1989d0b897cb52e3a'

async function main() {
    console.log('🧹 Cleaning old chat & mail data...')
    await prisma.chatMessage.deleteMany({})
    await prisma.chatConversation.deleteMany({})
    await prisma.mailThreadMessage.deleteMany({})
    await prisma.mailThread.deleteMany({})

    // Get customers for chat contacts
    const customers = await prisma.customer.findMany({ take: 6 })
    if (customers.length === 0) {
        console.log('⚠️  No customers found. Run seed-test-data.js first.')
        return
    }

    console.log(`📇 Found ${customers.length} customers for chat contacts`)

    // ==================== CHAT CONVERSATIONS ====================
    const now = new Date()
    const conversations = []

    // Create personal chats with first 5 customers
    for (let i = 0; i < Math.min(5, customers.length); i++) {
        const c = customers[i]
        const conv = await prisma.chatConversation.create({
            data: {
                chatType: 'personal',
                participantIds: [ADMIN_ID, c.id],
                lastMessage: getLastMessage(i),
                lastMessageTime: new Date(now.getTime() - i * 3600000),
            },
        })
        conversations.push({ conv, customer: c, index: i })
    }

    // Create a group chat if we have enough customers
    if (customers.length >= 3) {
        const groupConv = await prisma.chatConversation.create({
            data: {
                name: 'Project Team',
                avatar: '/img/others/img-19.jpg',
                chatType: 'groups',
                participantIds: [ADMIN_ID, customers[0].id, customers[1].id, customers[2].id],
                lastMessage: 'Let\'s finalize the proposal by Friday.',
                lastMessageTime: new Date(now.getTime() - 7200000),
            },
        })
        conversations.push({ conv: groupConv, isGroup: true })
    }

    console.log(`💬 Created ${conversations.length} conversations`)

    // Add messages to each conversation
    for (const { conv, customer, index, isGroup } of conversations) {
        if (isGroup) {
            await seedGroupMessages(conv.id, customers.slice(0, 3))
        } else {
            await seedPersonalMessages(conv.id, customer, index)
        }
    }

    console.log('✅ Chat messages seeded')

    // ==================== MAIL THREADS ====================
    const mailThreads = getMailThreadData(customers)

    for (const threadData of mailThreads) {
        const thread = await prisma.mailThread.create({
            data: {
                name: threadData.name,
                from: threadData.from,
                avatar: threadData.avatar,
                title: threadData.title,
                label: threadData.label,
                group: threadData.group,
                flagged: threadData.flagged,
                starred: threadData.starred,
                to: threadData.to,
                ownerId: ADMIN_ID,
            },
        })

        for (const msg of threadData.messages) {
            await prisma.mailThreadMessage.create({
                data: {
                    threadId: thread.id,
                    name: msg.name,
                    from: msg.from,
                    avatar: msg.avatar,
                    content: msg.content,
                    to: msg.to,
                    date: msg.date,
                    attachments: msg.attachments || [],
                },
            })
        }
    }

    console.log(`📧 Created ${mailThreads.length} mail threads`)
    console.log('🎉 Done!')
}

function getLastMessage(index) {
    const messages = [
        'Will do. Appreciate it!',
        'Perfect. I\'ll send the documents tomorrow.',
        'Thanks for the update 🙏',
        'Sounds good, let\'s schedule a call.',
        'Got it, I\'ll review and get back to you.',
    ]
    return messages[index % messages.length]
}

async function seedPersonalMessages(convId, customer, index) {
    const cName = `${customer.firstName} ${customer.lastName}`
    const cAvatar = customer.image || '/img/avatars/thumb-1.jpg'
    const adminName = 'Zak Chapman'
    const adminAvatar = '/img/avatars/thumb-1.jpg'

    const threads = [
        [
            { s: 'admin', c: 'Hey, can I ask you something?' },
            { s: 'other', c: 'Sure, what\'s up?' },
            { s: 'admin', c: 'I wanted to check on the project status. Are we on track?' },
            { s: 'other', c: 'Yes, everything is going well. We should be done by next week.' },
            { s: 'admin', c: 'Great, keep me posted on any blockers.' },
            { s: 'other', c: 'Will do. Appreciate it!' },
        ],
        [
            { s: 'other', c: 'Hi! I had a question about the invoice.' },
            { s: 'admin', c: 'Sure, which invoice are you referring to?' },
            { s: 'other', c: 'The one from last month. The amount seems different.' },
            { s: 'admin', c: 'Let me check that for you. I\'ll get back to you shortly.' },
            { s: 'other', c: 'Perfect. I\'ll send the documents tomorrow.' },
        ],
        [
            { s: 'admin', c: 'Did you receive the updated proposal?' },
            { s: 'other', c: 'Yes, I got it. Looks good overall.' },
            { s: 'admin', c: 'Any changes you\'d like to make?' },
            { s: 'other', c: 'Just a small tweak on the pricing section.' },
            { s: 'admin', c: 'No problem, I\'ll update it today.' },
            { s: 'other', c: 'Thanks for the update 🙏' },
        ],
        [
            { s: 'other', c: 'Hey, are you available for a quick call?' },
            { s: 'admin', c: 'I\'m in a meeting right now. Can we do 3 PM?' },
            { s: 'other', c: 'That works for me.' },
            { s: 'admin', c: 'Sounds good, let\'s schedule a call.' },
        ],
        [
            { s: 'admin', c: 'I\'ve sent over the contract for review.' },
            { s: 'other', c: 'Thanks! I\'ll take a look this afternoon.' },
            { s: 'admin', c: 'Let me know if you have any questions.' },
            { s: 'other', c: 'Got it, I\'ll review and get back to you.' },
        ],
    ]

    const thread = threads[index % threads.length]
    const baseTime = new Date()
    baseTime.setHours(baseTime.getHours() - thread.length)

    for (let i = 0; i < thread.length; i++) {
        const msg = thread[i]
        const isAdmin = msg.s === 'admin'
        await prisma.chatMessage.create({
            data: {
                conversationId: convId,
                senderId: isAdmin ? ADMIN_ID : customer.id,
                senderName: isAdmin ? adminName : cName,
                senderAvatar: isAdmin ? adminAvatar : cAvatar,
                content: msg.c,
                type: 'regular',
                date: new Date(baseTime.getTime() + i * 300000),
            },
        })
    }
}

async function seedGroupMessages(convId, customers) {
    const adminName = 'Zak Chapman'
    const adminAvatar = '/img/avatars/thumb-1.jpg'
    const members = [
        { id: ADMIN_ID, name: adminName, avatar: adminAvatar },
        ...customers.map((c) => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            avatar: c.image || '/img/avatars/thumb-1.jpg',
        })),
    ]

    const messages = [
        { mi: 1, c: 'Hey team, are we all set for the proposal?' },
        { mi: 2, c: 'I\'m still working on the financial section.' },
        { mi: 0, c: 'Take your time. Let\'s aim for Friday.' },
        { mi: 1, c: 'I can help with the design part if needed.' },
        { mi: 0, c: 'That would be great, thanks!' },
        { mi: 2, c: 'Let\'s finalize the proposal by Friday.' },
    ]

    const baseTime = new Date()
    baseTime.setHours(baseTime.getHours() - messages.length)

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        const member = members[msg.mi % members.length]
        await prisma.chatMessage.create({
            data: {
                conversationId: convId,
                senderId: member.id,
                senderName: member.name,
                senderAvatar: member.avatar,
                content: msg.c,
                type: 'regular',
                date: new Date(baseTime.getTime() + i * 300000),
            },
        })
    }
}

function getMailThreadData(customers) {
    const adminEmail = 'admin@trtmaroc.com'
    const threads = []

    // Inbox mails from customers
    for (let i = 0; i < Math.min(4, customers.length); i++) {
        const c = customers[i]
        threads.push({
            name: `${c.firstName} ${c.lastName}`,
            from: c.email,
            avatar: c.image || '/img/avatars/thumb-1.jpg',
            title: getMailSubject(i),
            label: ['work', 'private', 'important', ''][i % 4],
            group: 'inbox',
            flagged: i === 1,
            starred: false,
            to: [adminEmail],
            messages: [
                {
                    name: `${c.firstName} ${c.lastName}`,
                    from: c.email,
                    avatar: c.image || '/img/avatars/thumb-1.jpg',
                    to: [adminEmail],
                    date: getRelativeDate(i),
                    content: getMailContent(i, `${c.firstName} ${c.lastName}`),
                    attachments: i === 0 ? [{ file: 'Proposal.pdf', size: '2.1MB', type: 'pdf' }] : [],
                },
            ],
        })
    }

    // Sent items
    for (let i = 0; i < 2; i++) {
        const c = customers[i]
        threads.push({
            name: 'Zak Chapman',
            from: adminEmail,
            avatar: '/img/avatars/thumb-1.jpg',
            title: `Re: ${getMailSubject(i)}`,
            label: '',
            group: 'sentItem',
            flagged: false,
            starred: false,
            to: [c.email],
            messages: [
                {
                    name: `${c.firstName} ${c.lastName}`,
                    from: c.email,
                    avatar: c.image || '/img/avatars/thumb-1.jpg',
                    to: [adminEmail],
                    date: getRelativeDate(i + 1),
                    content: getMailContent(i, `${c.firstName} ${c.lastName}`),
                    attachments: [],
                },
                {
                    name: 'Zak Chapman',
                    from: adminEmail,
                    avatar: '/img/avatars/thumb-1.jpg',
                    to: [c.email],
                    date: getRelativeDate(i),
                    content: `<p>Hi ${c.firstName},</p><br /><p>Thank you for reaching out. I've reviewed the details and everything looks good. Let me know if you need anything else.</p><br /><p>Best regards,<br />Zak Chapman<br />TRT Digital</p>`,
                    attachments: [],
                },
            ],
        })
    }

    // Starred
    if (customers.length > 2) {
        const c = customers[2]
        threads.push({
            name: `${c.firstName} ${c.lastName}`,
            from: c.email,
            avatar: c.image || '/img/avatars/thumb-1.jpg',
            title: 'Partnership Opportunity',
            label: 'important',
            group: 'starred',
            flagged: false,
            starred: true,
            to: [adminEmail],
            messages: [
                {
                    name: `${c.firstName} ${c.lastName}`,
                    from: c.email,
                    avatar: c.image || '/img/avatars/thumb-1.jpg',
                    to: [adminEmail],
                    date: 'Mar 15',
                    content: `<p>Hi Zak,</p><br /><p>I wanted to discuss a potential partnership between our companies. We've been impressed with TRT Digital's work and believe there could be great synergy.</p><p>Would you be available for a call next week to explore this further?</p><br /><p>Best regards,<br />${c.firstName} ${c.lastName}</p>`,
                    attachments: [{ file: 'Partnership_Brief.pdf', size: '1.5MB', type: 'pdf' }],
                },
            ],
        })
    }

    // Draft
    threads.push({
        name: 'Zak Chapman',
        from: adminEmail,
        avatar: '/img/avatars/thumb-1.jpg',
        title: 'Monthly Newsletter - March 2026',
        label: 'work',
        group: 'draft',
        flagged: false,
        starred: false,
        to: ['team@trtdigital.ma'],
        messages: [
            {
                name: 'Zak Chapman',
                from: adminEmail,
                avatar: '/img/avatars/thumb-1.jpg',
                to: ['team@trtdigital.ma'],
                date: 'Draft',
                content: '<p>Hi Team,</p><br /><p>Here is our monthly update for March 2026...</p><br /><p>[Draft - to be completed]</p>',
                attachments: [],
            },
        ],
    })

    // Deleted
    if (customers.length > 4) {
        const c = customers[4]
        threads.push({
            name: `${c.firstName} ${c.lastName}`,
            from: c.email,
            avatar: c.image || '/img/avatars/thumb-1.jpg',
            title: 'Old inquiry',
            label: '',
            group: 'deleted',
            flagged: false,
            starred: false,
            to: [adminEmail],
            messages: [
                {
                    name: `${c.firstName} ${c.lastName}`,
                    from: c.email,
                    avatar: c.image || '/img/avatars/thumb-1.jpg',
                    to: [adminEmail],
                    date: 'Jan 10',
                    content: `<p>Hi,</p><br /><p>I had a question about your services but I've since found the information I needed. Thanks anyway!</p><br /><p>${c.firstName}</p>`,
                    attachments: [],
                },
            ],
        })
    }

    return threads
}

function getMailSubject(index) {
    const subjects = [
        'Project Proposal Review',
        'Invoice Clarification Needed',
        'Meeting Follow-up',
        'Service Inquiry',
    ]
    return subjects[index % subjects.length]
}

function getRelativeDate(daysAgo) {
    const dates = ['12:06PM', '9:35AM', 'Mar 18', 'Mar 15', 'Mar 10']
    return dates[daysAgo % dates.length]
}

function getMailContent(index, name) {
    const contents = [
        `<p>Hi Zak,</p><br /><p>I've attached the project proposal for your review. Please take a look at the timeline and budget sections and let me know if any adjustments are needed.</p><p>We're aiming to kick off by the end of this month, so your feedback would be greatly appreciated.</p><br /><p>Best regards,<br />${name}</p>`,
        `<p>Hi Zak,</p><br /><p>I noticed a discrepancy in the latest invoice. The amount charged doesn't match what we discussed. Could you please verify and send a corrected version?</p><br /><p>Thanks,<br />${name}</p>`,
        `<p>Hi Zak,</p><br /><p>Thanks for the productive meeting yesterday. I've summarized the key action items below and wanted to confirm we're aligned on next steps.</p><p>Looking forward to our continued collaboration.</p><br /><p>Regards,<br />${name}</p>`,
        `<p>Hi Zak,</p><br /><p>I'm interested in learning more about TRT Digital's web development services. Could you send me some information about your packages and pricing?</p><br /><p>Thank you,<br />${name}</p>`,
    ]
    return contents[index % contents.length]
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
