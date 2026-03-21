---
inclusion: auto
---

# TRT Maroc CRM - Full Project Roadmap

## Project Context
- Website: trtmaroc.com (Next.js)
- Template: trtdigital Admin Dashboard v1.2.7
- Database: MongoDB with Prisma ORM
- Goal: Full CRM & Company Management System

## Architecture Decisions
- All server actions use Prisma (`@/lib/prisma`) — NEVER import from `src/mock/data/`
- Data shapes returned by server actions must match what frontend components expect
- Auth via NextAuth 5 with credentials + OAuth
- State management: Zustand (per-feature stores)
- i18n: next-intl (en, ar, es, zh) — Arabic is priority for Morocco

---

## PHASE 1: Foundation (Current Sprint) ✅ IN PROGRESS

### 1.1 Database Setup ✅
- [x] Install Prisma + MongoDB provider
- [x] Create full schema (Users, Customers, Products, Orders, Projects, Tasks, Logs, etc.)
- [x] Create Prisma client singleton (`src/lib/prisma.js`)
- [x] Create seed script with sample data
- [x] Add DB scripts to package.json

### 1.2 Replace Mock Data with Real DB ✅
- [x] `validateCredential` — auth with bcrypt
- [x] `handleSignUp` — real user creation
- [x] `getCustomers` / `getCustomer` — Prisma queries
- [x] `getProducts` / `getProduct` — Prisma queries
- [x] `getOrderList` / `getOrderDetails` — Prisma queries with relations
- [x] `getProjects` / `getTasks` / `getTask` — Prisma queries
- [x] `getLogs` — activity logs from DB

### 1.3 AI Agent Hooks ✅
- [x] Auto Changelog Update (agentStop)
- [x] Database Schema Validator (postToolUse on write)
- [x] Pre-Task DB Consistency Check (preTaskExecution)
- [x] Prisma Auto Generate (fileEdited on schema.prisma)
- [x] Task Tracker Update (agentStop) — auto-updates src/data/tasks.json
- [x] Mock Data Import Detector (fileEdited) — flags mock imports in server actions
- [x] API Route Validator (postToolUse) — validates API route consistency
- [x] Environment & DB Connection Check (userTriggered) — manual DB health check

### 1.4 Project Infrastructure ✅
- [x] Architecture steering doc (.kiro/steering/architecture.md)
- [x] Coding standards steering doc (.kiro/steering/coding-standards.md)
- [x] Task tracker (src/data/tasks.json) — 12 tracked tasks across all phases
- [x] .env + .env.example created with all required variables
- [x] Fixed Prisma edge runtime error (split auth.config.js for middleware compatibility)

---

## PHASE 2: Complete Backend Wiring
### 2.1 Remaining Server Actions
- [ ] `getEcommerceDashboard` — aggregate real order/customer/product stats
- [ ] `getProjectDashboard` — aggregate project/task stats
- [ ] `getMarketingDashboard` — marketing metrics from DB
- [ ] `getAnalyticDashboard` — analytics from DB
- [ ] `getCalendar` — calendar events from DB
- [ ] `getChatList` / `getChatHistory` — chat from DB
- [ ] `getMail` / `getMailList` — mail from DB
- [ ] `getScrumboardData` / `getScrumboardMembers` — scrum from DB
- [ ] `getManageArticle` / `getArticle` — help center from DB
- [ ] `getPricingPlans` — pricing from DB
- [ ] `getRolesPermissionsRoles` / `getRolesPermissionsUsers` — RBAC from DB

### 2.2 API Routes — Add POST/PUT/DELETE
- [ ] `POST /api/customers` — create customer
- [ ] `PUT /api/customers/[id]` — update customer
- [ ] `DELETE /api/customers/[id]` — delete customer
- [ ] `POST /api/products` — create product
- [ ] `PUT /api/products/[id]` — update product
- [ ] `DELETE /api/products/[id]` — delete product
- [ ] `POST /api/orders` — create order
- [ ] `PUT /api/orders/[id]` — update order status
- [ ] `POST /api/projects` — create project
- [ ] `PUT /api/projects/[id]` — update project
- [ ] `POST /api/tasks` — create task
- [ ] `PUT /api/tasks/[id]` — update task
- [ ] `DELETE /api/tasks/[id]` — delete task

### 2.3 File Upload
- [ ] Integrate file upload (local or S3/Cloudinary)
- [ ] Product image upload
- [ ] Customer avatar upload
- [ ] File manager backend

---

## PHASE 3: Branding & Customization
### 3.1 TRT Maroc Branding
- [ ] Replace logos with TRT Maroc logos
- [ ] Update color scheme/theme to match trtmaroc.com
- [ ] Update app name, meta tags, favicon
- [ ] Customize login page with TRT branding

### 3.2 Navigation Restructure
- [ ] Reorganize sidebar for CRM workflow (Clients, Devis, Factures, Projets, etc.)
- [ ] Remove unused template demo pages
- [ ] Add TRT-specific menu items

### 3.3 Arabic Localization (Priority)
- [ ] Complete Arabic translations in messages/ar.json
- [ ] RTL layout testing and fixes
- [ ] French translations (messages/fr.json) — Morocco is FR/AR bilingual

---

## PHASE 4: CRM-Specific Features
### 4.1 Invoicing / Devis
- [ ] Invoice model in Prisma schema
- [ ] Invoice list/create/edit/detail pages
- [ ] PDF invoice generation
- [ ] Quote (Devis) management
- [ ] Invoice numbering system (TRT-2026-001)

### 4.2 Financial Dashboard
- [ ] Revenue tracking (monthly/yearly)
- [ ] Expense tracking
- [ ] Profit/loss reports
- [ ] Tax reports (Morocco-specific)

### 4.3 HR Module
- [ ] Employee model in schema
- [ ] Employee directory
- [ ] Leave management
- [ ] Attendance tracking
- [ ] Payroll basics

### 4.4 Communication
- [ ] Email integration (send real emails)
- [ ] SMS notifications (Morocco carriers)
- [ ] WhatsApp Business API integration
- [ ] Internal messaging system

---

## PHASE 5: Integration with trtmaroc.com
### 5.1 API Bridge
- [ ] Shared auth between website and CRM
- [ ] Customer sync (website signups → CRM)
- [ ] Order sync (website orders → CRM)
- [ ] Product catalog sync

### 5.2 Deployment
- [ ] Environment configuration (staging/production)
- [ ] MongoDB Atlas setup
- [ ] Vercel or VPS deployment
- [ ] Domain setup (admin.trtmaroc.com or crm.trtmaroc.com)
- [ ] SSL certificates
- [ ] CI/CD pipeline

### 5.3 Security
- [ ] Role-based access control (Admin, Manager, Employee, Viewer)
- [ ] API rate limiting
- [ ] Input sanitization
- [ ] Audit logging
- [ ] 2FA for admin accounts

---

## PHASE 6: Advanced Features
### 6.1 Reporting & Analytics
- [ ] Custom report builder
- [ ] Export to PDF/Excel/CSV
- [ ] Scheduled reports via email
- [ ] KPI dashboards per role

### 6.2 Automation
- [ ] Workflow automation (e.g., auto-assign tasks)
- [ ] Email templates & auto-responders
- [ ] Reminder system (follow-ups, due dates)
- [ ] Webhook integrations

### 6.3 AI Features
- [ ] AI chat assistant for internal use
- [ ] Smart customer insights
- [ ] Predictive analytics
- [ ] Auto-categorization of support tickets
