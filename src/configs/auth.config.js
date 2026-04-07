import Github from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

/**
 * Auth config used by both middleware (edge) and server-side auth.
 * Keep this file free of Node.js-only imports (e.g. Prisma)
 * so it can safely run in the edge runtime (middleware).
 */
// eslint-disable-next-line import/no-anonymous-default-export
export default {
    trustHost: true,
    providers: [
        Github({
            clientId: process.env.GITHUB_AUTH_CLIENT_ID,
            clientSecret: process.env.GITHUB_AUTH_CLIENT_SECRET,
        }),
        Google({
            clientId: process.env.GOOGLE_AUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_AUTH_CLIENT_SECRET,
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.authority = user.authority
                token.picture = user.image
            }
            return token
        },
        async session({ session, token }) {
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.sub,
                    authority: token.authority,
                    image: token.picture || null,
                },
            }
        },
    },
}
