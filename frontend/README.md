# 🌐 Aplos Logix MES — Frontend Application

A high-performance, modern Manufacturing Execution System (MES) and Operations Dashboard built with **React 19**, **Vite 7**, and **Tailwind CSS**.

---

## 🚀 Key Modules & Capabilities

- **Telemetry Dashboard (`/dashboard`)**: Live CPU, RAM, and network telemetry with historical 50-point Chart.js analytics and Super Admin PM2 process control actions (`START`, `STOP`, `RESTART`).
- **Flow Editor & Machine Launcher (`/nodered`)**:
  - Interactive table listing all industrial machines, lines, and test stations.
  - **Top 4 Recent Activity Cards** with relative time badges (*Just now*, *2m ago*, *Yesterday*) and 1-click **Launch Flow** buttons.
  - 1-Click interactive Node-RED embedded canvas with machine switcher dropdown and return button.
- **Machine Configuration Hub (`/machine-config`)**: Centralized IP/Port address book for production machines with persistent browser storage and environment defaults.
- **Activity & Audit Logs (`/activity`)**:
  - Exact second-level timestamps with AM/PM format (e.g. `01:23:45 PM (22 Aug 2026)`).
  - Comprehensive **"View Details" modal** breaking down Action Overview, Execution Timestamp, Triggered By, Client IP, User-Agent, and detailed JSON parameters with 1-click copy buttons.
  - 1-Click CSV export for compliance auditing.
- **User & Role Management (`/users`, `/roles`)**: Multi-role RBAC (`super_admin`, `admin`, `manager`, `user`) with dynamic page assignment matrix.
- **Dynamic Menu & Page Builder (`/pages`, `/menus`)**: Visual hierarchy tree with drag-and-drop ordering, badges, and external iframe sandboxes.
- **Super Admin Documentation Hub (`/docs`)**: In-app searchable technical documentation with 1-click code copying and print formatting.
- **Light / Dark Mode**: Theme switching with system preference detection and persistent context state.

---

## 🛠️ Development & Build Commands

```bash
# Install dependencies
npm install

# Start Vite development server (http://0.0.0.0:8800)
npm run dev

# Run headless dev server under PM2
npm run start:dev

# Build production bundle with minification
npm run build

# Preview production build locally
npm run preview
```

---

## 📂 Frontend Architecture

```text
src/
├── components/
│   ├── Layout/                     # Navigation sidebar, Header, Footer
│   ├── ProjectControlPanel.jsx      # PM2 live status & process control triggers
│   ├── EnhancedSystemInformation.jsx# Hardware, RAM, and network gauges
│   ├── EnhancedSystemPerformance.jsx# Chart.js live telemetry charts
│   ├── IconPicker.jsx              # Dynamic Lucide icon selector
│   └── LoadingSpinner.jsx          # Polished loading animations
├── context/
│   ├── AuthContext.jsx             # JWT token session state & role helpers
│   ├── ThemeContext.jsx            # Light/Dark mode state
│   └── MachineConfigContext.jsx    # Centralized machine IP/port store & recent activity tracker
├── pages/
│   ├── DashboardPage.jsx           # Main system monitoring dashboard
│   ├── NodeRedPage.jsx             # Flow Editor table launcher & live canvas
│   ├── MachineConfigPage.jsx       # Machine configuration admin hub
│   ├── ActivityLogsPage.jsx        # Audit logs with exact timestamps & details modal
│   ├── UsersPage.jsx               # User registry and status toggle
│   ├── RolesPage.jsx               # Role-page permission assignment matrix
│   ├── PagesPage.jsx               # Dynamic internal/external page registry
│   ├── MenuManagementPage.jsx      # Visual menu hierarchy tree editor
│   ├── DocsPage.jsx                # Super Admin documentation hub
│   ├── LoginPage.jsx               # Login card with validation
│   └── NotFoundPage.jsx            # 404 page
└── utils/
    ├── api.js                      # Axios instance with interceptors & endpoints
    ├── helpers.js                  # Date formatting, numbers, validation
    └── iconMap.jsx                 # Dynamic Lucide icon mapper
```

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| **Super Admin** | `superadmin@aploslogix.com` | `SuperAdmin123!` |
| **Admin** | `admin@aploslogix.com` | `Admin123!` |
| **Manager** | `manager@aploslogix.com` | `Manager123!` |
| **User** | `user@aploslogix.com` | `User123!` |
