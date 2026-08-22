# 🚀 Aplos Logix MES — Master Management Dashboard & Operations Portal

[![Node.js Version](https://img.shields.io/badge/Node.js-v22.x-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19.1.1-61DAFB?logo=react)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-v7.1.9-646CFF?logo=vite)](https://vitejs.dev/)
[![MySQL Version](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![PM2 Process Manager](https://img.shields.io/badge/PM2-Daemon-2B037A?logo=pm2)](https://pm2.keymetrics.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.6-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

An enterprise-grade **Manufacturing Execution System (MES)** and **Master Operations Control Center** built on a high-performance MERN-style architecture (Node.js, Express, React 19, MySQL 8.0, and PM2). 

Featuring full multi-role RBAC, real-time hardware telemetry, live PM2 process controls, centralized machine/line management, embedded Node-RED flow editors with recent activity tracking, comprehensive audit logs with exact second-level timestamps, dynamic menu & page builders, a Super Admin Documentation Hub, and a production-grade Windows service automation suite with automatic boot recovery and health watchdog.

---

## 📑 Table of Contents

- [Key Architecture Highlights](#-key-architecture-highlights)
- [System Features](#-system-features)
  - [1. Telemetry Dashboard & Live PM2 Controls](#1-telemetry-dashboard--live-pm2-controls)
  - [2. Flow Editor & Centralized Machine/Line Hub](#2-flow-editor--centralized-machineline-hub)
  - [3. Multi-Role RBAC & Granular Permissions](#3-multi-role-rbac--granular-permissions)
  - [4. Dynamic Pages & Menu Hierarchy](#4-dynamic-pages--menu-hierarchy)
  - [5. Enhanced Audit Trail & Exact Timestamps](#5-enhanced-audit-trail--exact-timestamps)
  - [6. Super Admin Documentation Hub (`/docs`)](#6-super-admin-documentation-hub-docs)
  - [7. Modern 404 Not Found Page](#7-modern-404-not-found-page)
- [Technology Stack](#-technology-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Windows PM2 Production Suite](#-windows-pm2-production-suite)
- [Installation & Quick Start](#-installation--quick-start)
- [Database Schema & Architecture](#-database-schema--architecture)
- [REST API Reference](#-rest-api-reference)
- [Environment Configuration](#-environment-configuration)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 🏛️ Key Architecture Highlights

```text
  +-------------------------------------------------------------------------------+
  |                             CLIENT BROWSER (Vite / React 19)                  |
  |                        http://192.168.1.37:8800  (Port 8800)                  |
  +---------------------------------------+---------------------------------------+
                                          |
                              REST API & Axios Interceptors
                              (Bearer JWT Authentication)
                                          |
                                          v
  +-------------------------------------------------------------------------------+
  |                        EXPRESS.JS BACKEND SERVER (Node.js)                    |
  |                        http://192.168.1.37:5000  (Port 5000)                  |
  +---------------------------------------+---------------------------------------+
  |  Middlewares: Helmet | CORS | RateLimit | ActivityLogger | Auth | ErrorHandler|
  +---------------------------------------+---------------------------------------+
      |                       |                               |
      v                       v                               v
+--------------+    +--------------------+        +-------------------------+
| MySQL 8.0 DB |    | Enhanced Monitor   |        | PM2 Windows Daemon      |
|  (Port 3306) |    | OS / CPU / RAM     |        | Auto-Restart / Watchdog |
+--------------+    +--------------------+        +-------------------------+
```

* **True Headless Frontend Runner**: Programmatic Node-based Vite dev server (`frontend/dev-server.js`) running under PM2 fork mode with no flashing terminal windows or interactive console dependencies.
* **Centralized Machine Lines Store**: `MachineConfigContext` provides unified access to all configured industrial lines and stations with persistent localStorage state and environment defaults.
* **Resilient Dual Storage Session**: Multi-key auth state persistence (`aplos_logix-token`, `aplos_logix-user`, `aplos_logix-theme` with backward-compatible fallbacks).
* **Automated Self-Healing Watchdog**: 3-minute scheduled watchdog task (`Aplos_Logix-PM2-HealthCheck`) that monitors endpoint health and recovers services without interrupting active work.
* **Silent VBScript Background Execution**: All Windows automation scripts leverage `run_silent.vbs` (`WScript.Shell.Run ..., 0, False`) to guarantee 100% invisible execution without intrusive command prompt popups.

---

## ✨ System Features

### 1. Telemetry Dashboard & Live PM2 Controls
* **Live System Metrics**: CPU utilization percentage, Memory consumption (used vs total), and API call volume charts powered by Chart.js with dynamic 30s polling.
* **Super Admin Control Center** (`super_admin` only):
  * **Real-Time PM2 Status**: View PIDs, memory in MB, individual process uptime, and restart counters.
  * **Database Cluster Health**: Direct MySQL connection latency ping.
  * **`START` Action**: Launches stopped backend/frontend processes.
  * **`STOP` Action**: Gracefully shuts down applications and writes a maintenance flag (`C:\ProgramData\Aplos_Logix\maintenance.flag`) to prevent watchdog auto-restarts during planned maintenance.
  * **`RESTART` Action**: Performs safe, zero-downtime service reload.
  * **`REFRESH STATUS` Action**: On-demand hardware telemetry fetch.

---

### 2. Flow Editor & Centralized Machine/Line Hub (`/nodered` & `/machine-config`)
* **Interactive Table Format View**:
  * Instead of opening a single hardcoded canvas, the Flow Editor opens a comprehensive table listing all configured industrial lines, machines, and test stations.
  * Columns: **Status / Active indicator**, **Machine Name & Description**, **IP Address / Host**, **Port**, **Protocol (`http`/`https`)**, **Last Opened Timestamp**, and **Actions**.
* **Top 4 Recent Activity Cards**:
  * Top of the Flow Editor displays the **Top 4 most recently accessed machines** with relative time badges (e.g. *Just now*, *5m ago*, *Yesterday*) and 1-click **Launch Flow** buttons.
* **1-Click Live Flow Launcher**:
  * Clicking any machine row seamlessly embeds that machine's live Node-RED Flow Editor in a dedicated canvas.
  * Canvas toolbar includes a prominent **`← Machine List`** return button, **Machine Switcher dropdown**, **Refresh**, **Open Direct in Tab**, and **Fullscreen** mode.
* **Complete Machine Management**:
  * Add, edit, test, and delete machine entries with live URL preview.
  * Set active / default machine with immediate system-wide persistence.

---

### 3. Multi-Role RBAC & Granular Permissions
* **Role Hierarchy**: `super_admin` (Unrestricted bypass), `admin` (System Administration), `manager` (Operational reports & review), `user` (Assigned pages access).
* **Role-Page Matrix**: Assign internal routes or external URLs to roles or individual users with immediate, real-time permission sync.
* **Backend Enforcers**: `auth`, `requireSuperAdmin`, `requireAdmin`, and `requireAssignedPages` middlewares.

---

### 4. Dynamic Pages & Menu Hierarchy
* **Page Management**: Register internal components or external websites (`is_external: 1`) with an integrated zoomable and fullscreen iframe viewer.
* **Visual Menu Hierarchy Tree**: Create parent categories, nested submenus, custom badge indicators (e.g. `NEW`, `PROD`, `V2`), and reorder items via drag-and-drop.

---

### 5. Enhanced Audit Trail & Exact Timestamps (`/activity`)
* **Audit Trail with Exact Precision**:
  * Records all user logins, logouts, entity creations, edits, and deletions.
  * Displays **Exact Timestamp with second-level precision & AM/PM** (e.g. `01:23:45 PM (22 Aug 2026)`) alongside relative time badges (*2 minutes ago*).
* **Comprehensive "View Details" Modal**:
  * **Action Overview**: Human-readable narrative explanation of the operation performed.
  * **Execution Timestamp**: Full date, time with seconds, and relative age.
  * **Triggered By**: Actor username, email address, and user ID.
  * **Target Resource**: Entity type (`User`, `Role`, `Page`, `System`, `Machine`) and entity ID.
  * **Client Information**: Client IP address and browser User-Agent string.
  * **Detailed Parameters**: Syntax-highlighted JSON viewer with 1-click **"Copy JSON"** and **"Copy Full Log Record"** actions.
* **Compliance Exports**: 1-click export of filtered audit logs into CSV spreadsheet format.

---

### 6. Super Admin Documentation Hub (`/docs`)
* **Auto-Generated Technical Specifications**: 11 documentation sections generated directly from verified codebase logic (Overview, User Manual for all modules, RBAC Matrix, Frontend & Backend Architecture, API Reference, MySQL Schema, PM2 & Deployment, Project Controls, Troubleshooting, and Developer Guide).
* **Interactive UI**: Real-time search filter, 1-click **Copy Code / Copy Command** buttons with toast confirmation, and PDF/print-friendly formatting.
* **Restricted Access**: Strictly protected on both frontend and backend by `super_admin` authorization.

---

### 7. Modern 404 Not Found Page
* **User-Friendly Error Experience**: Clean illustration, clear explanation of missing or inaccessible resources, and quick links to return to Dashboard or contact administrators.

---

## 💻 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | 19.1.1 | Reactive component architecture & state hooks |
| **Build & Dev Tool** | Vite | 7.1.9 | Fast development server & production builder |
| **Styling & Theme** | Tailwind CSS | 3.3.6 | Modern responsive utility classes & Dark/Light modes |
| **State & Context** | React Context API | — | Auth, Theme, and Centralized Machine Configuration |
| **Icons & Visuals** | Lucide React & Chart.js | Latest | Intuitive iconography and live telemetry charts |
| **Backend Runtime** | Node.js | v22.x | High-performance asynchronous JavaScript engine |
| **Backend Framework** | Express.js | 4.18.2 | RESTful routing, security middlewares, and business logic |
| **Database** | MySQL Server | 8.0.x | Relational relational database with InnoDB pooling |
| **Process Daemon** | PM2 | Latest | Windows background service manager & process monitoring |
| **Service Supervisor** | Windows Task Scheduler | — | 3-minute self-healing watchdog & boot resurrection |

---

## 📂 Project Directory Structure

```text
CMSCRM_SriCity/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection pool & environment setup
│   │   ├── controllers/        # Business logic & API request handlers
│   │   ├── middleware/         # Auth, RBAC, Activity Logger, Rate Limiter
│   │   ├── models/             # MySQL query models (User, Role, Page, ActivityLog)
│   │   ├── routes/             # Express route declarations (auth, control, doc, system)
│   │   └── utils/              # Hardware telemetry & system metrics monitors
│   ├── server.js               # Backend initialization entrypoint
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Layout, ProjectControlPanel, Modals)
│   │   ├── context/            # AuthContext, ThemeContext, MachineConfigContext
│   │   ├── pages/              # Dashboard, Flow Editor, ActivityLogs, Users, Roles, Pages, Docs
│   │   ├── utils/              # Axios API service, date formatting helpers, icon maps
│   │   ├── App.jsx             # Route definitions & protected layout wrappers
│   │   └── main.jsx            # React root mount
│   ├── dev-server.js           # Headless Node runner for Vite dev server under PM2
│   ├── vite.config.js          # Vite build & network host configuration
│   └── package.json
│
├── PM2-Setup/
│   ├── config.bat              # Central editable configuration (IPs, Ports, Paths)
│   ├── ecosystem.config.cjs    # PM2 master process definitions
│   ├── INSTALL_AND_SETUP.bat   # 1-Click Windows PM2 & Watchdog setup
│   ├── start-app.bat           # Idempotent application launcher
│   ├── stop-app.bat            # Graceful shutdown with maintenance mode flag
│   ├── restart-app.bat         # Zero-downtime service reload
│   ├── status-app.bat          # Real-time console status monitor
│   └── health-check.bat        # 3-minute scheduled watchdog script
│
├── logs/                       # PM2 application runtime stdout & stderr logs
├── ecosystem.config.cjs        # Root-level PM2 configuration
└── README.md                   # Project documentation master
```

---

## 🛠️ Installation & Quick Start

### 1. Prerequisites
- **Node.js**: v18.x or v22.x LTS installed
- **MySQL Server**: 8.0.x running on port `3306`
- **PM2** (optional for production daemon): `npm install -g pm2`

### 2. Backend Setup
```bash
cd backend
npm install
# Create/verify .env configuration
cp .env.example .env   # Configure DB_HOST, DB_USER, DB_PASS, DB_NAME
npm run start:dev      # Starts backend on http://0.0.0.0:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev            # Starts frontend on http://0.0.0.0:8800
```

### 4. Windows PM2 Automated Deployment
To install as a background Windows service with automatic startup and a 3-minute self-healing watchdog:
1. Open the `PM2-Setup/` folder.
2. Edit `config.bat` if your host IP, ports, or project paths differ.
3. Right-click `INSTALL_AND_SETUP.bat` and select **Run as Administrator**.
4. The system will register startup tasks, initialize PM2 daemon processes, and activate background monitoring.

---

## 🔌 REST API Reference

Base URL: `http://192.168.1.37:5000/api`

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/auth/login` | `POST` | Public | Login with email/username and password. |
| `/auth/logout` | `POST` | Authenticated | Terminate session and record logout activity. |
| `/auth/verify` | `GET` | Authenticated | Verify active JWT token validity. |
| `/auth/profile` | `GET` | Authenticated | Retrieve current user profile and roles. |
| `/control/status` | `GET` | Super Admin | Live PM2 status, CPU, RAM, DB ping, uptime. |
| `/control/action` | `POST` | Super Admin | Execute control action (`start`, `stop`, `restart`). |
| `/docs/sections` | `GET` | Super Admin | Complete documentation tree and technical manuals. |
| `/stats/recent-activity` | `GET` | Admin | Fetch user activity audit logs with full details. |
| `/exports/activity-logs` | `GET` | Admin | Export activity logs in CSV spreadsheet format. |
| `/users` | `GET`, `POST` | Admin | Manage system user accounts and role assignments. |
| `/roles` | `GET`, `POST` | Admin | Manage system security roles and page permissions. |
| `/pages` | `GET`, `POST` | Admin | Manage internal routes and external iframe tools. |
| `/menus/tree` | `GET` | Authenticated | Retrieve personalized navigation hierarchy. |
| `/system/performance` | `GET` | Admin | 50-point historical telemetry series for Chart.js. |

---

## 🔐 Default Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `superadmin@aploslogix.com` | `SuperAdmin123!` | Unrestricted Master Access + PM2 Controls + Docs |
| **Admin** | `admin@aploslogix.com` | `Admin123!` | User Management, Roles, Pages, Activity Logs |
| **Manager** | `manager@aploslogix.com` | `Manager123!` | Operational Reports & Telemetry Views |
| **User** | `user@aploslogix.com` | `User123!` | Assigned Pages & Workflows Only |

---

## 📄 License

Proprietary — All rights reserved © Aplos Logix.