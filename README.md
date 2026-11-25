# APIX — Airfare Price Index

**Airfare Price Index (APIX)** is a responsive, frontend-only airline analytics web application for Indian domestic air routes. It helps travelers search and compare airfares across carriers, track historical fare trends against a Base-100 Price Index, and export route-wise PDF/CSV reports, while providing administrators with full catalog and fare-record management.

**Live Application:** [Open APIX](https://ais-pre-5swaimp4jzkrq5jqkkgedu-77095146163.asia-northeast1.run.app)

---

## Highlights

- **Role-Based Workspaces:** Separate, role-aware navigation and dashboards for **Travelers** and **Administrators**.
- **Indian Aviation Dataset (INR `₹`):** Built around 11 major Indian airports (`DEL`, `BOM`, `BLR`, `HYD`, `MAA`, `CCU`, `GOI`, `PNQ`, `AMD`, `COK`, `JAI`), 6 domestic carriers (IndiGo, Air India, Vistara, Akasa Air, SpiceJet, Air India Express), 10 routes, and 800+ simulated historical fare records (2022–2026).
- **Base-100 Airfare Price Index:** Normalizes route fares against a historical baseline and classifies fares into **Low**, **Moderate**, and **High** tiers.
- **Client-Side Reporting:** Generates downloadable **PDF** (via `jsPDF`) and **CSV** route-wise fare reports directly in the browser.
- **Local Persistence:** All admin CRUD changes, recent searches, saved preferences, and session state persist in `localStorage` (`apix_state_v1`) with one-click JSON backup and dataset reset.

---

## Features

### Authentication & Access
- Split-screen **Login & Registration** experience with form validation, password visibility toggle, and quick role switching for demo evaluation.

### Traveler Workspace
- **Dashboard:** KPI cards (Average Fare, Lowest Fare, Price Index, Tracked Routes), quick flight search widget, historical airfare trend chart, recent searches, popular routes, and airline comparison overview.
- **Flight Search:** Source/destination airport selectors with one-click swap, travel date, passenger count, airline filter, fare-range filter, sorting, and side-by-side comparison selection.
- **Fare Comparison:** Interactive airline-by-airline fare table and comparison charts highlighting lowest, highest, and average fares for any selected route.
- **Price Trend & Analytics:** Route selector, monthly/yearly granularity toggles, historical fare line chart, Base-100 Airfare Price Index chart, Min/Avg/Max summaries, and Low/Moderate/High fare classification.
- **Reports:** Route-wise airfare summary with period filtering, graphical breakdown, and working frontend **PDF** and **CSV** exports.
- **Profile:** Account overview and traveler preferences.

### Administrator Workspace
- **Admin Dashboard:** Platform KPIs (Total Airlines, Active Routes, Fare Records, Registered Users), recent activity log, and fare volume/index trends.
- **Airline Management:** Full Create, Edit, and Delete CRUD workflows with validation modals and delete confirmation dialogs.
- **Route Management:** Add, update, and remove origin/destination airport routes.
- **Fare Data Management:** Filterable historical fare ledger with validated add/edit modals and delete confirmation prompts.
- **User Management:** Clean directory table of user accounts and assigned roles.
- **Settings:** Dataset export (JSON backup) and reset controls.

---

## Demo Credentials

Use the built-in quick-fill buttons on the login screen or sign in manually with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Traveler** | `arjun.mehta@apix.in` | `traveler123` |
| **Administrator** | `admin@apix.in` | `admin123` |

> **Note:** APIX is a frontend-only SRS prototype powered by simulated historical airfare records and browser `localStorage`. It does not connect to live airline GDS feeds or an external backend database.

---

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 8
- **Styling:** Tailwind CSS v4
- **Charts & Visualization:** Recharts 3
- **Icons:** Lucide React
- **PDF Generation:** jsPDF 4
- **Testing:** Node built-in test runner (`node:test`) with `tsx`

---

## Project Structure

```text
├── index.html
├── metadata.json
├── package.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types/
    │   └── apix.ts                  # Domain types for airlines, routes, fares, users & analytics
    ├── data/
    │   └── mockData.ts              # Simulated Indian airports, airlines, routes & historical fares
    ├── context/
    │   └── ApixContext.tsx          # App state, role auth, CRUD mutations & localStorage sync
    ├── utils/
    │   ├── apixAnalytics.ts         # Pure analytics: Base-100 index, trends, filtering & validation
    │   ├── apixAnalytics.test.ts    # Unit tests for analytics & validation logic
    │   └── pdfReport.ts             # Client-side PDF (jsPDF) and CSV report exporters
    ├── components/
    │   ├── layout/AppShell.tsx      # Role-aware sidebar, top bar, search & profile menu
    │   └── ui/CommonUI.tsx          # Reusable cards, modals, confirm dialogs, badges & toasts
    └── pages/
        ├── AuthPage.tsx
        ├── ReportsPage.tsx
        ├── traveler/
        │   ├── TravelerDashboard.tsx
        │   ├── FlightSearchPage.tsx
        │   ├── FareComparisonPage.tsx
        │   ├── PriceAnalyticsPage.tsx
        │   └── ProfilePage.tsx
        └── admin/
            ├── AdminDashboard.tsx
            ├── AirlineManagementPage.tsx
            ├── RouteManagementPage.tsx
            ├── FareDataManagementPage.tsx
            ├── UserManagementPage.tsx
            └── AdminSettingsPage.tsx
```

---

## Getting Started

### Prerequisites
- Node.js 20+ and npm

### Local Development

```bash
# Install dependencies
npm install

# Start the development server on http://localhost:3000
npm run dev
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite dev server on port `3000` |
| `npm run build` | Builds the production bundle into `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npx tsx --test src/utils/apixAnalytics.test.ts` | Runs unit tests for analytics and validation logic |

---

## Project Team

Developed as part of the **Airfare Price Index (APIX)** Software Requirements Specification (SRS):

- **Yash Shukla** (`EN24CS3011173`)
- **Yash Yadav** (`EN24CS3011174`)
- **Yasha Jain** (`EN24CS3011175`)
