'use server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const validateCredential = async (values) => {
    const { email, password } = values

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user || !user.password) return null

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) return null

    return {
        id: user.id,
        userName: user.name,
        email: user.email,
        avatar: user.image,
        authority: user.authority,
    }
}

export default validateCredential
