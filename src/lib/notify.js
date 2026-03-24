import prisma from '@/lib/prisma'

/**
 * Create a notification for a user
 * @param {string} userId - recipient user ID
 * @param {string} title - sender name or entity
 * @param {string} message - notification description
 * @param {string} type - info | success | warning | error
 * @param {string|null} link - URL path to navigate to when clicked
 */
export async function createNotification(userId, title, message, type = 'info', link = null) {
    try {
        await prisma.notification.create({
            data: { userId, title, message, type, link },
        })
    } catch (err) {
        console.error('Failed to create notification:', err)
    }
}
