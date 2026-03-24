const ALLOWED_ORIGINS = [
    'https://trtmaroc.com',
    'http://localhost:3001',
]

export function corsHeaders(request) {
    const origin = request?.headers?.get('origin') || ''
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ''
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
}

export function corsResponse(request) {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
}
