import { lazy } from 'react'
import {
    ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, GUEST,
    USERS_READ, USERS_WRITE,
    CUSTOMERS_READ, CUSTOMERS_WRITE,
    PRODUCTS_READ, PRODUCTS_WRITE,
    CONFIGURATIONS_READ, CONFIGURATIONS_WRITE,
    FILES_READ,
    REPORTS_READ, REPORTS_WRITE,
    INVOICES_READ, INVOICES_WRITE,
    CHAT_READ, CHAT_WRITE,
    MAIL_READ, MAIL_WRITE,
} from '@/constants/roles.constant'

const conceptsRoute = {
    '/concepts/ai/chat': {
        key: 'concepts.ai.chat',
        authority: [ADMIN, SUPERVISOR, SUPPORT, CONFIGURATIONS_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/ai/image': {
        key: 'concepts.ai.image',
        authority: [ADMIN, SUPERVISOR, SUPPORT, CONFIGURATIONS_READ],
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
    },
    '/concepts/projects/scrum-board': {
        key: 'concepts.projects.scrumBoard',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, REPORTS_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/projects/project-list': {
        key: 'concepts.projects.projectList',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, REPORTS_READ],
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
    },
    '/concepts/projects/tasks': {
        key: 'concepts.projects.projectTasks',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, REPORTS_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/projects/project-details/[slug]': {
        key: 'concepts.projects.projectDetails',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, REPORTS_READ],
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
        dynamicRoute: true,
    },
    '/concepts/projects/tasks/[slug]': {
        key: 'concepts.projects.projectIssue',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, REPORTS_READ],
        meta: { pageContainerType: 'contained' },
        dynamicRoute: true,
    },
    '/concepts/customers/customer-list': {
        key: 'concepts.customers.customerList',
        authority: [ADMIN, SUPERVISOR, SUPPORT, CUSTOMERS_READ],
    },
    '/concepts/customers/customer-edit/[slug]': {
        key: 'concepts.customers.customerEdit',
        authority: [ADMIN, SUPERVISOR, CUSTOMERS_WRITE],
        meta: {
            header: { title: 'Edit customer', description: 'Manage customer details, purchase history, and preferences.', contained: true },
            footer: false,
        },
        dynamicRoute: true,
    },
    '/concepts/customers/customer-create': {
        key: 'concepts.customers.customerCreate',
        authority: [ADMIN, SUPERVISOR, CUSTOMERS_WRITE],
        meta: {
            header: { title: 'Create customer', description: 'Manage customer details, track purchases, and update preferences easily.', contained: true },
            footer: false,
        },
    },
    '/concepts/customers/customer-details/[slug]': {
        key: 'concepts.customers.customerDetails',
        authority: [ADMIN, SUPERVISOR, SUPPORT, CUSTOMERS_READ],
        meta: { pageContainerType: 'contained' },
        dynamicRoute: true,
    },
    '/concepts/products/product-list': {
        key: 'concepts.products.productList',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, PRODUCTS_READ],
    },
    '/concepts/products/product-edit/[slug]': {
        key: 'concepts.products.productEdit',
        authority: [ADMIN, SUPERVISOR, PRODUCTS_WRITE],
        meta: {
            header: { title: 'Edit product', description: 'Quickly manage product details, stock, and availability.', contained: true },
            footer: false,
        },
        dynamicRoute: true,
    },
    '/concepts/products/product-create': {
        key: 'concepts.products.productCreate',
        authority: [ADMIN, SUPERVISOR, PRODUCTS_WRITE],
        meta: {
            header: { title: 'Create product', description: 'Quickly add products to your inventory. Enter key details, manage stock, and set availability.', contained: true },
            footer: false,
        },
    },
    '/concepts/orders/order-list': {
        key: 'concepts.orders.orderList',
        authority: [ADMIN, SUPERVISOR, SUPPORT, PRODUCTS_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/orders/order-create': {
        key: 'concepts.orders.orderCreate',
        authority: [ADMIN, SUPERVISOR, PRODUCTS_WRITE],
        meta: {
            header: { title: 'Create order', contained: true, description: 'Create new customer orders quickly and accurately' },
            footer: false,
        },
    },
    '/concepts/orders/order-edit/[slug]': {
        key: 'concepts.orders.orderEdit',
        authority: [ADMIN, SUPERVISOR, PRODUCTS_WRITE],
        meta: {
            header: { title: 'Edit order', contained: true, description: 'Manage and track orders efficiently' },
            footer: false,
        },
        dynamicRoute: true,
    },
    '/concepts/orders/order-details/[slug]': {
        key: 'concepts.orders.orderDetails',
        authority: [ADMIN, SUPERVISOR, SUPPORT, PRODUCTS_READ],
        meta: {
            header: {
                contained: true,
                title: lazy(() => import('@/app/(protected-pages)/concepts/orders/order-details/[id]/_components/OrderDetailHeader')),
                extraHeader: lazy(() => import('@/app/(protected-pages)/concepts/orders/order-details/[id]/_components/OrderDetailHeaderExtra')),
            },
            pageContainerType: 'contained',
        },
        dynamicRoute: true,
    },
    '/concepts/invoices/invoice-dashboard': {
        key: 'concepts.invoices.invoiceDashboard',
        authority: [ADMIN, SUPERVISOR, INVOICES_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/invoices/invoice-list': {
        key: 'concepts.invoices.invoiceList',
        authority: [ADMIN, SUPERVISOR, INVOICES_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/invoices/invoice-create': {
        key: 'concepts.invoices.invoiceCreate',
        authority: [ADMIN, SUPERVISOR, INVOICES_WRITE],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/invoices/invoice-edit/[slug]': {
        key: 'concepts.invoices.invoiceEdit',
        authority: [ADMIN, SUPERVISOR, INVOICES_WRITE],
        meta: { pageContainerType: 'contained' },
        dynamicRoute: true,
    },
    '/concepts/invoices/invoice-detail/[slug]': {
        key: 'concepts.invoices.invoiceDetail',
        authority: [ADMIN, SUPERVISOR, INVOICES_READ],
        meta: { pageContainerType: 'contained' },
        dynamicRoute: true,
    },
    '/concepts/account/settings': {
        key: 'concepts.account.settings',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, GUEST],
        meta: { header: { title: 'Settings' }, pageContainerType: 'contained' },
    },
    '/concepts/account/activity-log': {
        key: 'concepts.account.activityLog',
        authority: [ADMIN, SUPERVISOR, AUDITOR, REPORTS_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/account/pricing': {
        key: 'concepts.account.pricing',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR, GUEST],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/account/roles-permissions': {
        key: 'concepts.account.rolesPermissions',
        authority: [ADMIN, CONFIGURATIONS_WRITE],
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
    },
    '/concepts/help-center/support-hub': {
        key: 'concepts.helpCenter.supportHub',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, AUDITOR, REPORTS_READ],
        meta: { pageContainerType: 'gutterless', pageBackgroundType: 'plain' },
    },
    '/concepts/help-center/article/[slug]': {
        key: 'concepts.helpCenter.article',
        authority: [ADMIN, SUPERVISOR, SUPPORT, USER, AUDITOR, REPORTS_READ],
        dynamicRoute: true,
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
    },
    '/concepts/help-center/edit-article/[slug]': {
        key: 'concepts.helpCenter.editArticle',
        authority: [ADMIN, SUPERVISOR, REPORTS_WRITE],
        dynamicRoute: true,
        meta: { pageBackgroundType: 'plain', footer: false },
    },
    '/concepts/help-center/manage-article': {
        key: 'concepts.helpCenter.manageArticle',
        authority: [ADMIN, SUPERVISOR, REPORTS_WRITE],
        meta: { pageBackgroundType: 'plain', footer: false },
    },
    '/concepts/file-manager': {
        key: 'concepts.fileManager',
        authority: [ADMIN, SUPERVISOR, FILES_READ],
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
    },
    '/concepts/calendar': {
        key: 'concepts.calendar',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, AUDITOR],
        meta: { pageContainerType: 'contained', pageBackgroundType: 'plain' },
    },
    '/concepts/mail': {
        key: 'concepts.mail',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, MAIL_READ],
        meta: { pageContainerType: 'contained' },
    },
    '/concepts/chat': {
        key: 'concepts.chat',
        authority: [ADMIN, USER, SUPERVISOR, SUPPORT, CHAT_READ],
        meta: { pageContainerType: 'contained' },
    },
}

export default conceptsRoute