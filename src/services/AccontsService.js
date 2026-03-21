import ApiService from './ApiService'

export async function apiGetSettingsProfile() {
    return ApiService.fetchDataWithAxios({
        url: '/setting/profile',
        method: 'get',
    })
}

export async function apiPutSettingsProfile(data) {
    return ApiService.fetchDataWithAxios({
        url: '/setting/profile',
        method: 'put',
        data,
    })
}

export async function apiGetSettingsNotification() {
    return ApiService.fetchDataWithAxios({
        url: '/setting/notification',
        method: 'get',
    })
}

export async function apiPutSettingsNotification(data) {
    return ApiService.fetchDataWithAxios({
        url: '/setting/notification',
        method: 'put',
        data,
    })
}

export async function apiGetSettingsBilling() {
    return ApiService.fetchDataWithAxios({
        url: '/setting/billing',
        method: 'get',
    })
}

export async function apiPutSettingsBilling(data) {
    return ApiService.fetchDataWithAxios({
        url: '/setting/billing',
        method: 'put',
        data,
    })
}

export async function apiGetSettingsIntergration() {
    return ApiService.fetchDataWithAxios({
        url: '/setting/intergration',
        method: 'get',
    })
}

export async function apiPutSettingsIntergration(data) {
    return ApiService.fetchDataWithAxios({
        url: '/setting/intergration',
        method: 'put',
        data,
    })
}


export async function apiPutSettingsPassword(data) {
    return ApiService.fetchDataWithAxios({
        url: '/setting/password',
        method: 'put',
        data,
    })
}


export async function apiGetPricingPlans() {
    return ApiService.fetchDataWithAxios({
        url: '/pricing',
        method: 'get',
    })
}

export async function apiPutPricingPlan(data) {
    return ApiService.fetchDataWithAxios({
        url: '/pricing',
        method: 'put',
        data,
    })
}


export async function apiGetRoles() {
    return ApiService.fetchDataWithAxios({
        url: '/roles',
        method: 'get',
    })
}

export async function apiPutRole(data) {
    return ApiService.fetchDataWithAxios({
        url: '/roles',
        method: 'put',
        data,
    })
}

export async function apiGetRolesUsers(params) {
    return ApiService.fetchDataWithAxios({
        url: '/roles/users',
        method: 'get',
        params,
    })
}

export async function apiPutRolesUsers(data) {
    return ApiService.fetchDataWithAxios({
        url: '/roles/users',
        method: 'put',
        data,
    })
}
