'use client'
import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react'
import SessionContext from './SessionContext'

const SessionBridge = ({ serverSession, children }) => {
    const { data: clientSession, status } = useSession()

    // After update() is called, useSession() will refetch and return fresh data.
    // Use client session once it's loaded, fall back to server session during loading.
    const activeSession =
        status === 'authenticated' && clientSession
            ? clientSession
            : serverSession

    return (
        <SessionContext.Provider value={activeSession}>
            {children}
        </SessionContext.Provider>
    )
}

const AuthProvider = (props) => {
    const { session, children } = props

    return (
        <NextAuthSessionProvider
            session={session}
            refetchOnWindowFocus={false}
        >
            <SessionBridge serverSession={session}>
                {children}
            </SessionBridge>
        </NextAuthSessionProvider>
    )
}

export default AuthProvider
