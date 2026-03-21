---
inclusion: manual
---

# Settings Page — Full Reference

Complete documentation of the account settings system.
All settings are persisted to MongoDB via Prisma on the `User` model (and related models).

---

## Architecture Overview

```
Frontend Component → SWR (useSWR) → AccontsService → Axios → /api/setting/* → Prisma → MongoDB
```

| Layer | File |
|-------|------|
| Page | `src/app/(protected-pages)/concepts/account/settings/page.jsx` |
| Layout | `src/app/(protected-pages)/concepts/account/settings/_components/Settings.jsx` |
| Store | `src/app/(protected-pages)/concepts/account/settings/_store/settingsStore.js` |
| Menu | `src/app/(protected-pages)/concepts/account/settings/_components/SettingsMenu.jsx` |
| Mobile Menu | `src/app/(protected-pages)/concepts/account/settings/_components/SettingMobileMenu.jsx` |
| Service | `src/services/AccontsService.js` |
| Axios Base | `src/services/axios/AxiosBase.js` (baseURL: `/api`) |

---

## Tab 1: Profile

| | |
|---|---|
| Component | `SettingsProfile.jsx` |
| API GET | `GET /api/setting/profile` |
| API PUT | `PUT /api/setting/profile` |
| Service | `apiGetSettingsProfile()` / `apiPutSettingsProfile(data)` |
| Validation | Zod via react-hook-form |
| Save trigger | Form submit button |

### Fields

| Form Field | Zod Key | DB Column (User) | Type | Required | UI Component |
|---|---|---|---|---|---|
| Avatar | `img` | `image` | String? | No | Upload + Avatar |
| First name | `firstName` | `firstName` | String? | No | Input |
| User name | `lastName` | `lastName` | String? | No | Input |
| Email | `email` | `email` | String (unique) | Yes | Input (email) |
| Dial code | `dialCode` | `dialCode` | String? | No | Select (country flags) |
| Phone number | `phoneNumber` | `phone` | String? | No | NumericInput |
| Country | `country` | `country` | String? | No | Select (country list) |
| Address | `address` | `address` | String? | No | Input |
| City | `city` | `city` | String? | No | Input |
| Postal Code | `postcode` | `postcode` | String? | No | Input |

### Field mapping (frontend ↔ DB)

```
img        → image
phoneNumber → phone
dialCode   → dialCode
(all others match)
```

### Notes
- `birthday` is stored in DB but NOT shown in the form (hidden field, passed through)
- Country select uses `@/constants/countries.constant` with flag images at `/img/countries/{CODE}.png`
- Image upload creates a blob URL (not persisted to storage yet — needs TASK-010)

---

## Tab 2: Security

| | |
|---|---|
| Component | `SettingsSecurity.jsx` |
| API PUT | `PUT /api/setting/password` |
| Service | `apiPutSettingsPassword(data)` |
| Validation | Zod (all required, password match check) |
| Save trigger | Form submit → Confirm dialog → API call |

### Fields

| Form Field | Zod Key | Sent to API | Type | Required |
|---|---|---|---|---|
| Current password | `currentPassword` | `currentPassword` | String | Yes |
| New password | `newPassword` | `newPassword` | String | Yes |
| Confirm password | `confirmNewPassword` | (not sent) | String | Yes |

### Password change flow
1. User fills form → Zod validates (match check on confirm)
2. Confirm dialog opens
3. On confirm → `PUT /api/setting/password` with `{ currentPassword, newPassword }`
4. Server verifies current password with `bcrypt.compare()`
5. Hashes new password with `bcrypt.hash(newPassword, 10)`
6. Updates `User.password` in DB

### 2FA Section (UI only — NOT persisted)

The 2FA authenticator list is hardcoded in the component (local state only):

| Option | Value | Image |
|---|---|---|
| Google Authenticator | `googleAuthenticator` | `/img/others/google.png` |
| Okta Verify | `oktaVerify` | `/img/others/okta.png` |
| Email verification | `emailVerification` | `/img/others/email.png` |

State: `selected2FaType` (useState, defaults to `googleAuthenticator`)
**TODO**: Persist 2FA preference to DB if needed.

---

## Tab 3: Notification

| | |
|---|---|
| Component | `SettingsNotification.jsx` |
| API GET | `GET /api/setting/notification` |
| API PUT | `PUT /api/setting/notification` |
| Service | `apiGetSettingsNotification()` / `apiPutSettingsNotification(data)` |
| Save trigger | Auto-save on every toggle/change (optimistic update + API call) |

### Fields

| UI Element | JSON Key | DB Column (User) | Type | Default | UI Component |
|---|---|---|---|---|---|
| Desktop notification | `desktop` | `notifDesktop` | Boolean | `true` | Switcher |
| Unread badge | `unreadMessageBadge` | `notifUnreadBadge` | Boolean | `false` | Switcher |
| Notify me about | `notifymeAbout` | `notifAbout` | String? | `"mentionsOnly"` | Radio.Group |
| Email notifications | `email` | `notifEmail` | String[] | `[]` | Checkbox.Group + Switcher (all) |

### Notify Me Options (Radio)

| Label | Value |
|---|---|
| All new messages | `allNewMessage` |
| Mentions only | `mentionsOnly` |
| Nothing | `nothing` |

### Email Notification Options (Checkboxes)

| Label | Value |
|---|---|
| News & updates | `newsAndUpdate` |
| Tips & tutorials | `tipsAndTutorial` |
| Offer & promotions | `offerAndPromotion` |
| Follow up reminder | `followUpReminder` |

### Field mapping (frontend ↔ DB)

```
desktop            → notifDesktop
unreadMessageBadge → notifUnreadBadge
email              → notifEmail
notifymeAbout      → notifAbout
```

---

## Tab 4: Billing

| | |
|---|---|
| Component | `SettingsBilling.jsx` |
| Sub-component | `BillingHistory.jsx` |
| API GET | `GET /api/setting/billing` |
| API PUT | `PUT /api/setting/billing` (action-based) |
| Service | `apiGetSettingsBilling()` / `apiPutSettingsBilling(data)` |
| Save trigger | Credit card dialog submit / Plan change redirect |

### GET Response Shape

```json
{
  "currentPlan": {
    "plan": "Business board basic",
    "status": "active",
    "billingCycle": "monthly",
    "nextPaymentDate": 1739132800,
    "amount": 59.9
  },
  "paymentMethods": [
    {
      "cardId": "...",
      "cardHolderName": "...",
      "cardType": "VISA|MASTER",
      "expMonth": "12",
      "expYear": "25",
      "last4Number": "0392",
      "primary": true
    }
  ],
  "transactionHistory": [
    {
      "id": "#abcde",
      "item": "...",
      "status": "pending|paid|failed",
      "amount": 59.9,
      "date": 1639132800
    }
  ]
}
```

### Current Plan Fields (User model)

| JSON Key | DB Column (User) | Type | Default |
|---|---|---|---|
| `plan` | `currentPlan` | String? | `"Business board basic"` |
| `status` | `planStatus` | String? | `"active"` |
| `billingCycle` | `billingCycle` | String? | `"monthly"` |
| `nextPaymentDate` | `nextPaymentDate` | Int? | null (unix timestamp) |
| `amount` | `planAmount` | Float? | `59.9` |

### Payment Methods (UserPaymentMethod model)

| JSON Key | DB Column | Type |
|---|---|---|
| `cardId` | `id` | ObjectId |
| `cardHolderName` | `cardHolderName` | String |
| `cardType` | `cardType` | String (VISA/MASTER) |
| `last4Number` | `last4Number` | String |
| `expMonth` | `expMonth` | String |
| `expYear` | `expYear` | String |
| `primary` | `primary` | Boolean |

### Transactions (Transaction model)

| JSON Key | DB Column | Type |
|---|---|---|
| `id` | `id` (last 5 chars) | String |
| `item` | `item` | String |
| `status` | `status` | String (pending/paid/failed) |
| `amount` | `amount` | Float |
| `date` | `date` | Int (unix timestamp) |

### PUT Actions

| Action | Body Fields | What it does |
|---|---|---|
| `updatePlan` | `plan, status, billingCycle, nextPaymentDate, amount` | Updates User plan fields |
| `addPaymentMethod` | `cardHolderName, cardType, last4Number, expMonth, expYear, primary` | Creates UserPaymentMethod |
| `editPaymentMethod` | `cardId, cardHolderName, cardType, last4Number, expMonth, expYear, primary` | Updates UserPaymentMethod |

### External Components
- `CreditCardDialog` from `@/components/view/CreditCardDialog` — shared dialog for add/edit card
- Plan change redirects to `/concepts/account/pricing`

---

## Tab 5: Integration

| | |
|---|---|
| Component | `SettingIntegration.jsx` |
| API GET | `GET /api/setting/intergration` |
| API PUT | `PUT /api/setting/intergration` |
| Service | `apiGetSettingsIntergration()` / `apiPutSettingsIntergration(data)` |
| Save trigger | Auto-save on Switcher toggle |
| DB Model | `UserIntegration` |

### Fields per integration

| JSON Key | DB Column | Type |
|---|---|---|
| `id` | `id` | ObjectId |
| `name` | `name` | String |
| `desc` | `desc` | String? |
| `img` | `img` | String? |
| `type` | `type` | String? |
| `active` | `active` | Boolean |

### Default Integrations (auto-seeded on first GET)

| Name | Type | Image |
|---|---|---|
| Google Drive | Cloud storage | `/img/thumbs/google-drive.png` |
| Slack | Notifications and events | `/img/thumbs/slack.png` |
| Notion | Content management | `/img/thumbs/notion.png` |
| Jira | Project management | `/img/thumbs/jira.png` |
| Zendesk | Customer service | `/img/thumbs/zendesk.png` |
| Dropbox | Cloud storage | `/img/thumbs/dropbox.png` |
| Github | Code repositories | `/img/thumbs/github.png` |
| Gitlab | Code repositories | `/img/thumbs/gitlab.png` |
| Figma | Design tools | `/img/thumbs/figma.png` |
| Adobe XD | Design tools | `/img/thumbs/adobe-xd.png` |
| Sketch | Design tools | `/img/thumbs/sketch.png` |
| Hubspot | Content management | `/img/thumbs/hubspot.png` |
| Zapier | Notifications and events | `/img/thumbs/zapier.png` |

### Unique constraint
`@@unique([userId, name])` — one integration per name per user.

---

## Navigation Store

File: `settingsStore.js` (Zustand)

```js
{ currentView: 'profile' }  // 'profile' | 'security' | 'notification' | 'billing' | 'integration'
```

Menu items defined in `SettingsMenu.jsx`:

| Label | Value | Icon |
|---|---|---|
| Profile | `profile` | TbUserSquare |
| Security | `security` | TbLock |
| Notification | `notification` | TbBell |
| Billing | `billing` | TbFileDollar |
| Integration | `integration` | TbRefreshDot |

---

## API Routes Summary

| Method | Route | Auth | DB Model | Purpose |
|---|---|---|---|---|
| GET | `/api/setting/profile` | Yes | User | Load profile fields |
| PUT | `/api/setting/profile` | Yes | User | Save profile fields |
| GET | `/api/setting/notification` | Yes | User | Load notification prefs |
| PUT | `/api/setting/notification` | Yes | User | Save notification prefs |
| GET | `/api/setting/billing` | Yes | User + UserPaymentMethod + Transaction | Load plan, cards, history |
| PUT | `/api/setting/billing` | Yes | User / UserPaymentMethod | Action-based (updatePlan/addPaymentMethod/editPaymentMethod) |
| GET | `/api/setting/intergration` | Yes | UserIntegration | Load integrations (auto-seeds defaults) |
| PUT | `/api/setting/intergration` | Yes | UserIntegration | Toggle integration active/inactive |
| PUT | `/api/setting/password` | Yes | User | Change password (bcrypt verify + hash) |

---

## Known Limitations / TODOs

1. **Image upload** — Profile avatar uses `URL.createObjectURL()` (blob URL, lost on refresh). Needs real file upload (TASK-010).
2. **2FA** — UI only, not persisted to DB. Need a `twoFactorMethod` field on User if implementing.
3. **Delete payment method** — No DELETE endpoint yet. Only add/edit.
4. **Delete account** — No UI or endpoint for account deletion.
5. **Billing history** — Read-only from Transaction model. No UI to create transactions manually.
6. **Plan change** — Redirects to pricing page but no API to actually change the plan from that page.
7. **Email change** — Profile PUT allows email change but no verification flow.
8. **Typo**: Route path is `/intergration` (not `/integration`) — matches original codebase convention.
