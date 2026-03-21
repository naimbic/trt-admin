import { ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, REPORTS_READ } from '@/constants/roles.constant'

const dashboardsRoute = {
    '/dashboards/ecommerce': {
        key: 'dashboard.ecommerce',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, REPORTS_READ],
        meta: {
            pageContainerType: 'contained',
        },
    },
    '/dashboards/project': {
        key: 'dashboard.project',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, REPORTS_READ],
        meta: {
            pageContainerType: 'contained',
        },
    },
    '/dashboards/marketing': {
        key: 'dashboard.marketing',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, REPORTS_READ],
        meta: {
            pageContainerType: 'contained',
        },
    },
    '/dashboards/analytic': {
        key: 'dashboard.analytic',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, REPORTS_READ],
        meta: {
            pageContainerType: 'contained',
            pageBackgroundType: 'plain',
        },
    },
}

export default dashboardsRoute
