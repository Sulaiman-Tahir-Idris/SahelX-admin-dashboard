# REPO_BRAIN.md — SahelX Admin Dashboard

Primary source of truth for repository structure, architecture, conventions, and agent behavior.

---

## 1. Executive Summary & Architecture

**SahelX Admin Dashboard** is a logistics and courier management platform built with Next.js App Router and Firebase. It supports multi-role administrative access (Super Admin, Secretary, Rider/Courier) to handle:
- **Delivery Management**: Order creation, tracking, status updates, batch/multiple deliveries.
- **Fleet & Rider Operations**: Live GPS tracking, rider onboarding, availability management.
- **Customer & Financial Management**: Customer profiles, delivery history, revenue reports.
- **Role-based Authentication**: Firebase Auth for Admin, Secretary, and Investor portals.

---

## 2. Tech Stack & Key Libraries

- **Framework**: Next.js 16.0.7 (App Router), React 19, TypeScript 5
- **Styling & UI**: Tailwind CSS 3, Radix UI primitives, Lucide Icons, Shadcn components (`components/ui/`)
- **Database & Auth**: Firebase 11+ (`firebase` client SDK, `firebase-admin` server SDK)
- **Mapping & GIS**: `@react-google-maps/api`
- **Charts & Data Viz**: Recharts
- **PDF & Export**: jsPDF, XLSX, FileSaver

---

## 3. Directory Layout

```
SahelX-admin-dashboard/
├── app/                        # Next.js App Router routes
│   ├── (auth)/                 # Shared auth route group
│   ├── admin/                  # Admin portal pages (dashboard, riders, deliveries, revenue, etc.)
│   ├── secretary/              # Secretary portal pages & actions
│   ├── setup-admin/            # Initial admin bootstrap/signup page
│   ├── live-map/               # Standalone live map tracking page
│   ├── api/                    # Server-side API endpoints
│   │   └── admin/create-courier # Server-side courier creation (Firebase Admin SDK)
│   ├── globals.css             # Global styles & Tailwind configuration
│   └── layout.tsx              # Root layout & providers
├── components/                 # React UI components
│   ├── admin/                  # Admin profile & management components
│   ├── analytics/              # Revenue, delivery, & rider analytics widgets
│   ├── customers/              # Customer tables & profile views
│   ├── dashboard/              # Core dashboard widgets, maps, and stats
│   ├── deliveries/             # Delivery tables and modal dialogs
│   ├── live-map/               # Real-time map tracking components
│   ├── multiple-deliveries/    # Batch delivery handling UI
│   ├── revenue/                # Financial analytics and reporting
│   ├── riders/                 # Rider management and table views
│   ├── settings/               # System settings components
│   └── ui/                     # Reusable Shadcn / Radix UI elements
├── hooks/                      # Custom React hooks
├── lib/                        # Services, utility functions, & configurations
│   ├── firebase/               # Firebase config, auth, and Firestore data access services
│   │   ├── config.ts           # Firebase client app initialization
│   │   ├── admin.ts            # Firebase Admin SDK server initialization
│   │   ├── auth.ts             # Admin auth logic & state listeners
│   │   ├── secretaryAuth.ts    # Secretary auth logic
│   │   ├── deliveries.ts       # Delivery CRUD and query services
│   │   ├── riders.ts           # Rider CRUD and real-time subscription services
│   │   ├── customers.ts        # Customer data access
│   │   ├── payments.ts         # Payment & revenue queries
│   │   └── settings.ts         # System settings services
│   └── utils.ts                # Classname merge & utility helpers
├── public/                     # Static assets & icons
├── .env.local                  # Active local environment variables
├── .env.example                # Template for environment variables
└── package.json                # Project dependencies and npm scripts
```

---

## 4. Key Files Index

| File Path | Description |
| --------- | ----------- |
| [`lib/firebase/config.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/config.ts) | Client-side Firebase App, Auth, and Firestore initialization |
| [`lib/firebase/admin.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/admin.ts) | Server-side Firebase Admin SDK initialization using service credentials |
| [`lib/firebase/auth.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/auth.ts) | Admin authentication helpers and state listeners |
| [`lib/firebase/secretaryAuth.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/secretaryAuth.ts) | Secretary authentication helpers |
| [`lib/firebase/investorAuth.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/investorAuth.ts) | Investor authentication helpers |
| [`lib/firebase/deliveries.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/deliveries.ts) | Delivery query and mutation operations |
| [`lib/firebase/riders.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/lib/firebase/riders.ts) | Rider profiles and real-time GPS location subscriptions |
| [`app/admin/dashboard/page.tsx`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/app/admin/dashboard/page.tsx) | Main Admin Dashboard view |
| [`app/api/admin/create-courier/route.ts`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/app/api/admin/create-courier/route.ts) | API route for creating courier user accounts via Admin SDK |
| [`app/admin/messages/page.tsx`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/app/admin/messages/page.tsx) | Messaging interface for Admins |
| [`app/secretary/messages/page.tsx`](file:///c:/Users/DELL/Documents/GitHub/SahelX-admin-dashboard/app/secretary/messages/page.tsx) | Messaging interface for Secretaries |

---

## 5. Environment Variables

| Variable Name | Required Scope | Description |
| ------------- | -------------- | ----------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Client & Server | Firebase Web SDK API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Client & Server | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Client & Server | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Client & Server | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client & Server | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Client & Server | Firebase Web App ID |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Google Maps API Key for map renders |
| `FIREBASE_PROJECT_ID` | Server only | Firebase Admin project ID |
| `FIREBASE_CLIENT_EMAIL` | Server only | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY` | Server only | Firebase Admin private key |

---

## 6. Gotchas & Conventions

- **Next.js Version Compatibility**: The project runs Next.js 16 (App Router) with React 19. Ensure async params and server context rules are observed according to Next 16 specs.
- **Client Environment Variables**: Client-side Firebase configs MUST use `NEXT_PUBLIC_` prefixes to be accessible in browser components.
- **Server Admin SDK**: Firebase Admin actions (e.g. creating auth accounts server-side) require `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in `.env.local`.
- **Dark Mode**: Implemented via `localStorage("sahelx-theme")` + `document.documentElement.classList.toggle("dark", ...)` in header components. The `dark` CSS class on `<html>` activates `.dark` variant CSS custom properties in `globals.css`. No `next-themes` dependency.
- **Framer Motion**: Installed (`framer-motion`). Use `ease: 'easeOut'` (string) not `ease: [0.4, 0, 0.2, 1]` (number array) — the latter is not assignable to Framer Motion's `Easing` type in this version.
- **Font System**: Sora (headings via `font-heading` utility or `h1-h6` selectors) + Inter (body). Loaded via `next/font/google` in `app/layout.tsx`. Font CSS variables: `--font-sora`, `--font-inter`.
- **Brand Colors**: Primary = SahelX Red `#D93C3C`. Admin portal uses red accents; Secretary portal uses amber `#F59E0B` accents for visual distinction.
- **Image Assets**: Hero and login images stored in `public/images/`. Generated specifically for admin portal: `hero-illustration.jpg`, `admin-login.jpg`, `secretary-login.jpg`.

---

## 7. Change Log

| Date | Agent | Change Summary |
| ---- | ----- | -------------- |
| 2026-08-04 | Antigravity | Created `.env.local`, `.env.example`, updated `lib/firebase/config.ts`, and initialized `REPO_BRAIN.md`. |
| 2026-08-04 | Antigravity | Added Firebase Admin SDK credentials (`client_email` and `private_key`) to `.env.local`. |
| 2026-08-04 | Antigravity | Full UI redesign: installed framer-motion, updated globals.css & tailwind.config.ts with SahelX design system, generated hero/login images, redesigned landing page, admin login, secretary login, both headers, both sidebars, both layout loading states, and overview stats cards. |
| 2026-08-05 | Antigravity | Added unified messaging between admins and secretaries, created secretary messaging portal, updated auth hooks. |
| 2026-08-06 | Antigravity | Implemented Finance Module Phases 6, 7, 8 (Reports, Analytics, Dashboard) with PDF/Excel/CSV exports and comprehensive charting. |
| 2026-08-06 | Antigravity | Implemented Finance Module Phases 2 and 3: Added Manual Entries tab to Revenue Page and created comprehensive Expenses Page with role-based approvals. |
| 2026-08-06 | Antigravity | Implemented Finance Module Phases 4, 5, 9: Built Cash Book, Bank Accounts, and Finance Settings. Verified clean build across all 8 new finance routes. |
| 2026-08-06 | Antigravity | Refactored Finance forms for mobile responsiveness, beautified PDF/Excel exports with instant SVG generation, and wired secretary manual deliveries to auto-sync to Finance payments. |
| 2026-08-06 | Antigravity | Implemented Historical Data Upload across Finance pages (exceljs dropdowns), and the new Salary Module with dynamic commission configurations. |
| 2026-08-06 | Antigravity | Updated site favicon, title ("X Circle Playground"), and Open Graph/Twitter social metadata across admin dashboard to use `/icons/SahelX Icons/web/` assets. Added `metadataBase` to resolve OG image warnings. Fixed `next.config.mjs` ESLint deprecation warning and updated `baseline-browser-mapping` package. |
| 2026-08-06 | Antigravity | Copied SahelX web icons to sahelxLanding public folder and updated `src/app/layout.tsx` with matching favicon, Open Graph, and Twitter card metadata. |
| 2026-08-06 | Antigravity | Applied full mobile/tablet/desktop responsiveness to all 7 finance pages: stacked page headers, wrapping filter bars, flex-wrap TabsLists, and properly stepped grid layouts (1→2→4 cols). Build verified clean. |
| 2026-08-06 | Antigravity | Executed Engineering Audit: Lazy-loaded spreadsheet/PDF libraries (`xlsx-js-style`, `jspdf`, `exceljs`), uninstalled duplicate `xlsx`, removed 212KB static logo base64, deleted 3.5MB unused assets, added global loading/error boundaries, and centralized `useRole` hook. |
| 2026-08-30 | Antigravity | Added new Investor role, Investor portal (/investor), and Admin Investor Management pages under Finance. |
| 2026-09-04 | Antigravity | Updated Dashboard: Fixed rider delivery status bug, auto-approve & delete expenses with auto-refunds, cross-deleted salaries with linked expenses, added bank account edit/delete, split Secretaries payroll tab, added Investor Portfolio ROI line chart, and built Investor Settings Contacts module. |
| 2026-09-04 | Antigravity | Added new Assets module (`app/admin/assets`) to track and manage company property. |
