import ApiService from './ApiService'

export async function apiGetCustomerLog({ ...params }) {
    return ApiService.fetchDataWithAxios({
        url: `/customers/log`,
        method: 'get',
        params,
    })
}

export async function apiGetCustomers({ ...params }) {
    return ApiService.fetchDataWithAxios({
        url: `/customers`,
        method: 'get',
        params,
    })
}

export async function apiCreateCustomer(data) {
    return ApiService.fetchDataWithAxios({
        url: `/customers`,
        method: 'post',
        data,
    })
}

export async function apiUpdateCustomer(id, data) {
    return ApiService.fetchDataWithAxios({
        url: `/customers/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteCustomer(id) {
    return ApiService.fetchDataWithAxios({
        url: `/customers/${id}`,
        method: 'delete',
    })
}
