import ApiService from './ApiService'

export async function apiGetConversation({ id }) {
    return ApiService.fetchDataWithAxios({
        url: `/conversations/${id}`,
        method: 'get',
    })
}

export async function apiSendMessage({ id, content, type, attachments }) {
    return ApiService.fetchDataWithAxios({
        url: `/chat/${id}`,
        method: 'post',
        data: { content, type, attachments },
    })
}

export async function apiGetContacts() {
    return ApiService.fetchDataWithAxios({
        url: `/contacts`,
        method: 'get',
    })
}

export async function apiGetContactDetails({ id }) {
    return ApiService.fetchDataWithAxios({
        url: `/contacts/${id}`,
        method: 'get',
    })
}

export async function apiCreateConversation({ participantIds, chatType, name }) {
    return ApiService.fetchDataWithAxios({
        url: `/chat`,
        method: 'post',
        data: { participantIds, chatType, name },
    })
}
