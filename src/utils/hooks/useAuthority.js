'use client'

import { useMemo } from 'react'
import isEmpty from 'lodash/isEmpty'

function useAuthority(userAuthority = [], authority = [], emptyCheck = false) {
    const roleMatched = useMemo(() => {
        // Admin role has superuser access to everything
        if (userAuthority.includes('admin')) return true
        return authority.some((role) => userAuthority.includes(role))
    }, [authority, userAuthority])

    if (
        isEmpty(authority) ||
        isEmpty(userAuthority) ||
        typeof authority === 'undefined'
    ) {
        return !emptyCheck
    }

    return roleMatched
}

export default useAuthority
