import ApiService from './ApiService'

export async function apiGetInvoices(params) {
    return ApiService.fetchDataWithAxios({
        url: '/invoices',
        method: 'get',
        params,
    })
}

export async function apiGetInvoice(id) {
    return ApiService.fetchDataWithAxios({
        url: `/invoices/${id}`,
        method: 'get',
    })
}

export async function apiCreateInvoice(data) {
    return ApiService.fetchDataWithAxios({
        url: '/invoices',
        method: 'post',
        data,
    })
}

export async function apiUpdateInvoice(id, data) {
    return ApiService.fetchDataWithAxios({
        url: `/invoices/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteInvoice(id) {
    return ApiService.fetchDataWithAxios({
        url: `/invoices/${id}`,
        method: 'delete',
    })
}
