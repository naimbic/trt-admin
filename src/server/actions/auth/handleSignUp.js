'use server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const onSignUpWithCredentials = async ({ email, userName, password }) => {
    try {
        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            throw new Error('User already exists')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                name: userName,
                email,
                password: hashedPassword,
                authority: ['user'],
            },
        })

        return {
            email: user.email,
            userName: user.name,
            id: user.id,
        }
    } catch (error) {
        throw error
    }
}
