import ApiService from './ApiService'

export async function apiGetProductList(params) {
    return ApiService.fetchDataWithAxios({
        url: '/products',
        method: 'get',
        params,
    })
}

export async function apiGetProduct({ id, ...params }) {
    return ApiService.fetchDataWithAxios({
        url: `/products/${id}`,
        method: 'get',
        params,
    })
}

export async function apiCreateProduct(data) {
    return ApiService.fetchDataWithAxios({
        url: '/products',
        method: 'post',
        data,
    })
}

export async function apiUpdateProduct(id, data) {
    return ApiService.fetchDataWithAxios({
        url: `/products/${id}`,
        method: 'put',
        data,
    })
}

export async function apiDeleteProduct(id) {
    return ApiService.fetchDataWithAxios({
        url: `/products/${id}`,
        method: 'delete',
    })
}
