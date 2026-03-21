import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// Default integrations to seed for new users
const DEFAULT_INTEGRATIONS = [
    { name: 'Google Drive', desc: 'Upload your files to Google Drive', img: '/img/thumbs/google-drive.png', type: 'Cloud storage', active: false },
    { name: 'Slack', desc: 'Post to a Slack channel', img: '/img/thumbs/slack.png', type: 'Notifications and events', active: false },
    { name: 'Notion', desc: 'Retrieve notion note to your project', img: '/img/thumbs/notion.png', type: 'Content management', active: false },
    { name: 'Jira', desc: 'Create Jira issues', img: '/img/thumbs/jira.png', type: 'Project management', active: false },
    { name: 'Zendesk', desc: 'Exchange data with Zendesk', img: '/img/thumbs/zendesk.png', type: 'Customer service', active: false },
    { name: 'Dropbox', desc: 'Exchange data with Dropbox', img: '/img/thumbs/dropbox.png', type: 'Cloud storage', active: false },
    { name: 'Github', desc: 'Exchange files with a GitHub repository', img: '/img/thumbs/github.png', type: 'Code repositories', active: false },
    { name: 'Gitlab', desc: 'Exchange files with a Gitlab repository', img: '/img/thumbs/gitlab.png', type: 'Code repositories', active: false },
    { name: 'Figma', desc: 'Exchange screenshots with Figma', img: '/img/thumbs/figma.png', type: 'Design tools', active: false },
    { name: 'Adobe XD', desc: 'Exchange screenshots with Adobe XD', img: '/img/thumbs/adobe-xd.png', type: 'Design tools', active: false },
    { name: 'Sketch', desc: 'Exchange screenshots with Sketch', img: '/img/thumbs/sketch.png', type: 'Design tools', active: false },
    { name: 'Hubspot', desc: 'Exchange data with Hubspot', img: '/img/thumbs/hubspot.png', type: 'Content management', active: false },
    { name: 'Zapier', desc: 'Integrate with hundreds of services.', img: '/img/thumbs/zapier.png', type: 'Notifications and events', active: false },
]

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let integrations = await prisma.userIntegration.findMany({
            where: { userId: session.user.id },
            orderBy: { name: 'asc' },
        })

        // Seed defaults if user has no integrations yet
        if (integrations.length === 0) {
            for (const i of DEFAULT_INTEGRATIONS) {
                await prisma.userIntegration.upsert({
                    where: {
                        userId_name: {
                            userId: session.user.id,
                            name: i.name,
                        },
                    },
                    update: {},
                    create: {
                        userId: session.user.id,
                        ...i,
                    },
                })
            }
            integrations = await prisma.userIntegration.findMany({
                where: { userId: session.user.id },
                orderBy: { name: 'asc' },
            })
        }

        return NextResponse.json(
            integrations.map((i) => ({
                id: i.id,
                name: i.name,
                desc: i.desc,
                img: i.img,
                type: i.type,
                active: i.active,
            }))
        )
    } catch (error) {
        console.error('GET /api/setting/intergration error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { id, active } = body

        await prisma.userIntegration.updateMany({
            where: { id, userId: session.user.id },
            data: { active },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PUT /api/setting/intergration error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}