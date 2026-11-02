<p align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React Logo" width="70" height="70" />
</p>

<h1 align="center">Retail Management & FP-Growth Recommendation - Web Frontend</h1>

<p align="center">
  <b>Modern React 19 & Tailwind CSS single page web dashboard for Retail Point of Sale (POS) and Market Basket Recommendation system, featuring cashier checkout, real-time FP-Growth association rules visualizer, product placement layout suggestions, and role-based access control.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/DaisyUI-5.7-5A0EF8?style=flat&logo=daisyui&logoColor=white" alt="DaisyUI" />
  <img src="https://img.shields.io/badge/Chart.js-4.6-FF6384?style=flat&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/React_Router-7.18-CA4245?style=flat&logo=react-router&logoColor=white" alt="React Router v7" />
  <img src="https://img.shields.io/badge/Axios-1.20-5A29E4?style=flat&logo=axios&logoColor=white" alt="Axios" />
</p>

---

## 📌 Overview

**Retail Management & FP-Growth Recommendation Web Frontend** is an enterprise-grade Single Page Application (SPA) designed to empower retail store operations, cashiers, and store managers. 

The application delivers a dual capability:
1. **High-Efficiency Point of Sale (POS):** Fast barcode scanning, instant product lookup, real-time cart calculations, and digital receipt generation for seamless frontline retail transactions.
2. **Retail Intelligence & FP-Growth Visualizer:** Direct translation of transaction histories into data-driven merchandising insights. Store managers can interactively explore frequent item purchase patterns (Market Basket Analysis), evaluate association rules (Support, Confidence, Lift Ratio), and implement optimized adjacent product placement strategies (Cross-selling / Bundling).

The frontend communicates with the **Retail Recommendation ASP.NET Core 8 Web API** via RESTful endpoints protected by JWT Bearer token authentication.

---

## 🚀 Key Features

### 🛒 Point of Sale (POS) Cashier Terminal (`/pos`)
- **Fast Product Lookup:** Instant search by product name, SKU, or barcode with keyboard-friendly workflows.
- **Dynamic Shopping Cart:** Real-time quantity adjustments, subtotal, discount, and tax calculations.
- **Payment Processing:** Multiple payment methods, exact tender / change calculation, and modal receipt preview.
- **Receipt Printing:** Formatted digital receipts optimized for standard POS thermal receipt printers.

### 🧠 FP-Growth Pattern Mining & Product Placement (`/patterns`)
- **Interactive Rule Mining:** Real-time parameter tuning for **Minimum Support** ($s$), **Minimum Confidence** ($c$), and **Minimum Lift Ratio** ($l$).
- **Rule Categorization:** Tabbed stratification of association rules:
  - **All Rules:** Complete rule set passing threshold filters.
  - **Peluang 100%:** Deterministic associations where consequent is guaranteed given the antecedent.
  - **Peluang Tinggi:** High-confidence rules ($> 70\%$) ideal for strategic shelf co-location.
  - **Peluang Sedang:** Moderate correlations suitable for seasonal bundles and promotional discounts.
- **Merchandising Layout Visualizer:** Clear Antecedent $\to$ Consequent recommendation cards indicating exactly which products should be displayed side-by-side to maximize cross-selling basket size.
- **Product-Specific Filters:** Dropdown filter to inspect association patterns for any individual product SKU.

### 📊 Executive Retail Dashboard (`/dashboard`)
- **Key Metric KPI Cards:** Today's Total Revenue, Daily Transaction Count, Active Product Catalog, and Low-Stock Warnings.
- **Visual Analytics:** Interactive 7-day revenue trend graphs and category sales distributions.
- **Top-Selling Leaderboard:** Real-time ranking of best-selling products by quantity and revenue contribution.

### 📦 Retail Inventory & Master Data
- **Products Catalog (`/products`):** Full CRUD for product SKUs, pricing, cost, barcodes, and category mapping.
- **Categories Management (`/categories`):** Hierarchical product category classification.
- **Transaction Ledger (`/transactions`):** Historical audit log of all completed transactions with line-item detail inspection.

### 🛡️ Security & Role-Based Access Control (RBAC)
- **Granular Permissions:** Dynamic sidebar navigation rendered based on role permissions assigned via `Menus`, `Roles`, `Groups`, and `MenuRoles`.
- **JWT Authentication:** Automatic token storage, HTTP header injection via Axios interceptors, and automatic redirect on session expiration.
- **Self-Service Account Recovery:** Password reset flow with email OTP verification.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| **Frontend Framework** | React 19 (JavaScript ES6+) |
| **Build Tool & Bundler** | Vite 8.3 |
| **CSS Framework** | Tailwind CSS v4 + DaisyUI v5 |
| **Routing** | React Router DOM v7 |
| **Data Visualization** | Chart.js v4 & Custom SVG Graphics |
| **Data Tables** | Custom reusable DataTable component with sorting, pagination, and search |
| **HTTP Client** | Axios v1.20 with request/response interceptors |
| **Icons** | FontAwesome 6 |

---

## 📂 Project Structure

```plaintext
Template FE/
├── public/                 # Static public assets
├── src/
│   ├── assets/             # Brand logos, icons, vector illustrations
│   ├── components/         # Reusable UI components
│   │   ├── DashboardLayout.jsx # Authenticated sidebar & header shell
│   │   ├── DataTable.jsx       # Advanced paginated data table
│   │   ├── Navigation.jsx      # Top navigation header
│   │   ├── Footer.jsx          # Dashboard footer
│   │   └── PublicFooter.jsx    # Public page footer
│   ├── context/            # React context providers
│   │   └── AuthContext.jsx # Global user auth & permissions state
│   ├── pages/              # Application views & pages
│   │   ├── analysis/       # FP-Growth patterns & placement recommendations
│   │   │   └── Patterns.jsx
│   │   ├── auth/           # Login, ForgotPassword, VerifyOtp, ResetPassword
│   │   ├── categories/     # Category master data
│   │   ├── dashboard/      # Executive KPI & sales charts
│   │   ├── groups/         # User group management
│   │   ├── menuroles/      # RBAC permission matrix mapping
│   │   ├── menus/          # Dynamic menu definitions
│   │   ├── pos/            # Cashier Point of Sale terminal
│   │   ├── products/       # Product master inventory
│   │   ├── roles/          # System role administration
│   │   ├── transactions/   # Historical transactions archive
│   │   └── users/          # User account administration
│   ├── services/
│   │   └── api.js          # Centralized Axios client & API interceptors
│   ├── utils/              # Helper utilities (cookies, date formatters, navigation)
│   ├── App.jsx             # Main routing configuration
│   ├── main.jsx            # React root mount entry point
│   ├── index.css           # Global Tailwind CSS styles
│   └── dashboard.css       # Custom dashboard styling overrides
├── package.json            # Project dependencies & scripts
├── vite.config.js          # Vite build configuration
└── eslint.config.js        # ESLint code quality rules
```

---

## ⚙️ Setup and Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or pnpm / yarn)
- Backend API running at `http://localhost:5000` (or configured API port)

### Step 1: Clone the Repository
```bash
git clone https://github.com/tijartaufikrahman/retail-recommendation-fe.git
cd retail-recommendation-fe
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Create a `.env` file in the root directory (if customizing backend URL):
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
*(Defaults to `/api` proxy or standard API gateway in `src/services/api.js`).*

### Step 4: Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Step 5: Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory, ready for deployment to Nginx, Apache, or cloud hosting (Vercel, Netlify, Cloud VPS).

---

## 👥 Default Login Credentials

| Role | Username | Default Password |
|---|---|---|
| **Administrator** | `admin` | `12345` |
| **Kasir (Cashier)** | `kasir` | `12345` |
| **Manajer (Manager)**| `manager` | `12345` |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
