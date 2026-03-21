import ApiService from './ApiService'

export async function apiGetFiles(params) {
    return ApiService.fetchDataWithAxios({
        url: '/files',
        method: 'get',
        params,
    })
}

export async function apiCreateFolder(data) {
    return ApiService.fetchDataWithAxios({
        url: '/files',
        method: 'post',
        data,
    })
}

export async function apiRenameFile(data) {
    return ApiService.fetchDataWithAxios({
        url: '/files',
        method: 'put',
        data,
    })
}

export async function apiDeleteFile(id) {
    return ApiService.fetchDataWithAxios({
        url: `/files?id=${id}`,
        method: 'delete',
    })
}
