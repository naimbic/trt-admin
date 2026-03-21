import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import spaces, { BUCKET } from '@/lib/spaces'

export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const folder = searchParams.get('id') || ''

        const files = await prisma.file.findMany({
            where: { folder: folder || null },
            orderBy: { createdAt: 'desc' },
        })

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true, image: true },
        })

        const list = await Promise.all(files.map(async (f) => {
            let size = f.size || 0
            // For directories, sum the sizes of all children
            if (f.fileType === 'directory') {
                const children = await prisma.file.findMany({
                    where: { folder: f.id },
                    select: { size: true },
                })
                size = children.reduce((sum, c) => sum + (c.size || 0), 0)
            }
            return {
                id: f.id,
                name: f.name,
                fileType: f.fileType,
                srcUrl: f.url || '',
                size,
                author: {
                    name: user?.name || 'Unknown',
                    email: user?.email || '',
                    img: user?.image || '',
                },
                activities: [
                    {
                        userName: user?.name || 'Unknown',
                        userImg: user?.image || '',
                        actionType: 'CREATE',
                        timestamp: Math.floor(f.createdAt.getTime() / 1000),
                    },
                ],
                permissions: [
                    {
                        userName: user?.name || 'Unknown',
                        userImg: user?.image || '',
                        role: 'owner',
                    },
                ],
                uploadDate: Math.floor(f.createdAt.getTime() / 1000),
                recent: true,
            }
        }))

        // Build directory breadcrumb
        let directory = []
        if (folder) {
            directory = [{ id: folder, label: folder }]
        }

        return NextResponse.json({ list, directory })
    } catch (error) {
        console.error('GET /api/files error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { action } = body

        if (action === 'createFolder') {
            const file = await prisma.file.create({
                data: {
                    name: body.name || 'New Folder',
                    fileType: 'directory',
                    size: 0,
                    url: '',
                    folder: body.folder || null,
                    uploadedBy: session.user.id,
                },
            })
            return NextResponse.json({ success: true, id: file.id })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (error) {
        console.error('POST /api/files error:', error)
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
        const { id, name } = body

        if (!id || !name) {
            return NextResponse.json({ error: 'Missing id or name' }, { status: 400 })
        }

        await prisma.file.update({
            where: { id },
            data: { name },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PUT /api/files error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 })
        }

        const file = await prisma.file.findUnique({ where: { id } })
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Delete from DO Spaces if it has a URL (not a folder)
        if (file.url && file.fileType !== 'directory') {
            try {
                const key = file.url.split('.cdn.digitaloceanspaces.com/')[1]
                if (key) {
                    await spaces.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
                }
            } catch (e) {
                console.error('S3 delete error (non-fatal):', e)
            }
        }

        // If directory, delete children too
        if (file.fileType === 'directory') {
            const children = await prisma.file.findMany({ where: { folder: id } })
            for (const child of children) {
                if (child.url && child.fileType !== 'directory') {
                    try {
                        const key = child.url.split('.cdn.digitaloceanspaces.com/')[1]
                        if (key) {
                            await spaces.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
                        }
                    } catch (e) {
                        console.error('S3 child delete error (non-fatal):', e)
                    }
                }
            }
            await prisma.file.deleteMany({ where: { folder: id } })
        }

        await prisma.file.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/files error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
