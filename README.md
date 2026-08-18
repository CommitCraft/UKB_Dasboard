# 🚀 Aplos Logix MES — Master Management Dashboard & Operations Portal

[![Node.js Version](https://img.shields.io/badge/Node.js-v22.x-339933?logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19.1.1-61DAFB?logo=react)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-v7.1.9-646CFF?logo=vite)](https://vitejs.dev/)
[![MySQL Version](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![PM2 Process Manager](https://img.shields.io/badge/PM2-Daemon-2B037A?logo=pm2)](https://pm2.keymetrics.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3.6-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#license)

An enterprise-grade **Manufacturing Execution System (MES)** and **Master Operations Control Center** built on a high-performance MERN-style architecture (Node.js, Express, React 19, MySQL 8.0, and PM2). 

Featuring full multi-role RBAC, real-time hardware telemetry, live PM2 process controls, dynamic menu & page builders, audit logging, a Super Admin Documentation Hub, and a production-grade Windows service automation suite with automatic boot recovery and a watchdog health-check.

---

## 📑 Table of Contents

- [Key Architecture Highlights](#-key-architecture-highlights)
- [System Features](#-system-features)
  - [1. Telemetry Dashboard & Live PM2 Controls](#1-telemetry-dashboard--live-pm2-controls)
  - [2. Multi-Role RBAC & Granular Permissions](#2-multi-role-rbac--granular-permissions)
  - [3. Dynamic Pages & Menu Hierarchy](#3-dynamic-pages--menu-hierarchy)
  - [4. Audit Trail & Compliance Exports](#4-audit-trail--compliance-exports)
  - [5. Super Admin Documentation Hub (`/docs`)](#5-super-admin-documentation-hub-docs)
  - [6. Modern 404 Not Found Page](#6-modern-404-not-found-page)
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

### 2. Multi-Role RBAC & Granular Permissions
* **Role Hierarchy**: `super_admin` (Unrestricted bypass), `admin` (System Administration), `manager` (Operational reports & review), `user` (Assigned pages access).
* **Role-Page Matrix**: Assign internal routes or external URLs to roles or individual users with immediate, real-time permission sync.
* **Backend Enforcers**: `auth`, `requireSuperAdmin`, `requireAdmin`, and `requireAssignedPages` middlewares.

### 3. Dynamic Pages & Menu Hierarchy
* **Page Management**: Register internal components or external websites (`is_external: 1`) with an integrated zoomable and fullscreen iframe viewer.
* **Visual Menu Hierarchy Tree**: Create parent categories, nested submenus, custom badge indicators (e.g. `NEW`, `PROD`, `V2`), and reorder items via drag-and-drop.

### 4. Audit Trail & Compliance Exports
* **Activity & Audit Logs**: Automatic tracking of logins, logouts, entity mutations (create/update/delete), client IPs, and browser User-Agents.
* **Compliance Exports**: 1-click export of filtered audit logs into CSV spreadsheet and JSON formats.

### 5. Super Admin Documentation Hub (`/docs`)
* **Auto-Generated Technical Specifications**: 11 documentation sections generated directly from verified codebase logic (Overview, User Manual for all modules, RBAC Matrix, Frontend & Backend Architecture, API Reference, MySQL Schema, PM2 & Deployment, Project Controls, Troubleshooting, and Developer Guide).
* **Interactive UI**: Real-time search filter, 1-click **Copy Code / Copy Command** buttons with toast confirmation, and PDF/print-friendly formatting.
* **Restricted Access**: Strictly protected on both frontend and backend by `super_admin` authorization.

### 6. Modern 404 Not Found Page
* **Responsive Visual 404 Screen**: Displays dynamic path reporting (`location.pathname`), animated typography, smooth theme adaptation, **Go Back**, and smart **Go to Dashboard / Go to Login** navigation.

---

## 🛠️ Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | `19.1.1` | Modern declarative component architecture |
| **Build & Dev Tool** | Vite | `7.1.9` | High-speed dev server and optimized production bundler |
| **UI Styling** | Tailwind CSS | `3.3.6` | Utility-first responsive design with dark/light themes |
| **Icons & Charts** | Lucide React & Chart.js | Latest | Intuitive iconography and live telemetry visualizations |
| **Backend Runtime** | Node.js | `v22.x` | High-performance asynchronous JavaScript engine |
| **API Framework** | Express.js | `4.18.2` | Robust REST API routing, rate limiting, and middlewares |
| **Database Engine** | MySQL Server | `8.0.x` | Relational data store with `mysql2/promise` connection pooling |
| **Process Supervisor** | PM2 | `Latest` | Enterprise process clustering, restart policies, and logging |
| **Automation** | Windows Task Scheduler & VBS | Native | Auto-start on boot (90s delay) & 3-min silent health watchdog |

---

## 📁 Project Directory Structure

```text
CMSCRM_SriCity/
├── backend/
│   ├── server.js                      # Express server entry point & middleware stack
│   ├── package.json                   # Backend dependencies & scripts
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                  # MySQL pool & schema initialization
│   │   ├── controllers/
│   │   │   ├── authController.js      # Auth, profile, and password handlers
│   │   │   ├── controlController.js   # PM2 status & START/STOP/RESTART actions
│   │   │   ├── docController.js       # Super Admin documentation provider
│   │   │   └── systemController.js    # Hardware metrics & process statistics
│   │   ├── middleware/
│   │   │   ├── auth.js                # JWT validation & requireSuperAdmin/requireAdmin
│   │   │   ├── activityLogger.js      # Audit trail database logging
│   │   │   ├── errorHandler.js        # Centralized error response formatter
│   │   │   └── validation.js          # Express-validator input schemas
│   │   ├── models/
│   │   │   ├── user.js                # User entity & credential queries
│   │   │   ├── role.js                # Role entity & page mappings
│   │   │   ├── page.js                # Page registry & hierarchy builder
│   │   │   └── activityLog.js         # Audit log records & filters
│   │   ├── routes/
│   │   │   ├── index.js               # Master API route aggregator
│   │   │   ├── authRoutes.js          # /api/auth endpoints
│   │   │   ├── controlRoutes.js       # /api/control endpoints (Super Admin)
│   │   │   ├── docRoutes.js           # /api/docs endpoints (Super Admin)
│   │   │   └── systemRoutes.js        # /api/system endpoints
│   │   └── utils/
│   │       └── enhancedSystemMonitor.js # OS & PM2 hardware telemetry
├── frontend/
│   ├── dev-server.js                  # Headless Vite runner for PM2
│   ├── vite.config.js                 # Vite bundler configuration
│   ├── package.json                   # Frontend dependencies
│   ├── src/
│   │   ├── main.jsx                   # React root entry point
│   │   ├── App.jsx                    # Route hierarchy & ProtectedRoute guards
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # JWT session state & role helpers
│   │   │   └── ThemeContext.jsx       # Dark / Light theme provider
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx      # System telemetry & ProjectControlPanel
│   │   │   ├── UsersPage.jsx          # User management table & CRUD modals
│   │   │   ├── RolesPage.jsx          # Role management & permissions matrix
│   │   │   ├── PagesPage.jsx          # Dynamic page registry & iframe preview
│   │   │   ├── MenuManagementPage.jsx # Navigation tree & badge editor
│   │   │   ├── ActivityLogsPage.jsx   # Audit logs & export center
│   │   │   ├── DocsPage.jsx           # Super Admin Documentation Hub
│   │   │   ├── NotFoundPage.jsx       # 404 Page Not Found
│   │   │   └── LoginPage.jsx          # Login portal
│   │   ├── components/
│   │   │   ├── Layout/                # Responsive Sidebar, NavItemTree, Header, Footer
│   │   │   ├── ProjectControlPanel.jsx # Live PM2 control interface
│   │   │   ├── EnhancedSystemInformation.jsx # Hardware & RAM stats
│   │   │   └── EnhancedSystemPerformance.jsx # Chart.js performance graphs
│   │   └── utils/
│   │       └── api.js                 # Axios instance with interceptors & endpoint registry
├── PM2-Setup/
│   ├── config.bat                     # Single editable configuration file
│   ├── ecosystem.config.cjs           # Master PM2 process ecosystem
│   ├── INSTALL_AND_SETUP.bat          # One-click Windows installer & task registrar
│   ├── start-app.bat                  # Safe application starter & state saver
│   ├── stop-app.bat                   # Safe stopper (activates maintenance flag)
│   ├── restart-app.bat                # Zero-downtime service reloader
│   ├── status-app.bat                 # Terminal PM2 status monitor
│   └── health-check.bat               # Watchdog recovery script
└── logs/                              # PM2 stdout and stderr log files
```

---

## ⚙️ Windows PM2 Production Suite

The project includes an enterprise automation suite located in `PM2-Setup/`:

| Script / Config | Purpose |
|---|---|
| [`PM2-Setup/config.bat`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/config.bat) | **Single Editable Config**: Defines project root path, ports, and process names in one place. |
| [`PM2-Setup/ecosystem.config.cjs`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/ecosystem.config.cjs) | PM2 cluster configuration for headless backend and frontend runners. |
| [`PM2-Setup/INSTALL_AND_SETUP.bat`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/INSTALL_AND_SETUP.bat) | **One-Click Setup**: Installs PM2 globally, registers startup boot task (`Aplos_Logix-PM2-Startup`) and silent watchdog task (`Aplos_Logix-PM2-HealthCheck`) in Windows Task Scheduler. |
| [`PM2-Setup/start-app.bat`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/start-app.bat) | Starts all services and removes the maintenance flag. |
| [`PM2-Setup/stop-app.bat`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/stop-app.bat) | Shuts down services and sets `maintenance.flag` so the watchdog does not auto-restart them. |
| [`PM2-Setup/restart-app.bat`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/restart-app.bat) | Performs zero-downtime application restart. |
| [`PM2-Setup/status-app.bat`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/status-app.bat) | Displays live terminal process table, memory, CPU, and recent log outputs. |

---

## 🚀 Installation & Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` ([Download Node.js](https://nodejs.org/))
- **MySQL Server**: `8.0.x` ([Download MySQL](https://dev.mysql.com/downloads/installer/))
- **PM2**: Installed automatically by setup script, or run `npm install -g pm2`

### 2. Initial Setup
1. Clone or extract the project repository to your desired directory.
2. Verify that `PROJECT_PATH` in `PM2-Setup/config.bat` matches your project path.
3. Configure your database credentials in `backend/.env`.

### 3. One-Click Automated Deployment
1. Open the `PM2-Setup/` folder.
2. Right-click on **`INSTALL_AND_SETUP.bat`** and select **Run as administrator**.
3. The script will automatically:
   - Verify Node.js and PM2 prerequisites.
   - Start the backend API on port `5000` and frontend on port `8800`.
   - Save the PM2 state (`pm2 save --force`).
   - Register the silent Windows boot auto-start and 3-minute watchdog tasks.

### 4. Access the Application
* **Frontend Web App**: `http://localhost:8800` (or `http://192.168.1.37:8800`)
* **Backend REST API**: `http://localhost:5000/api`
* **Default Super Admin Login**:
  * **Email / Username**: `superadmin` (or `superadmin@aplos_logix.com`)
  * **Password**: `SuperAdmin123!`

---

## 🗄️ Database Schema & Architecture

The database is built on **MySQL 8.0 (InnoDB)** using `utf8mb4_unicode_ci` character encoding.

### Core Tables
1. **`users`**: Account credentials, usernames, email addresses, and active/inactive statuses.
2. **`roles`**: System roles (`super_admin`, `admin`, `manager`, `user`).
3. **`pages`**: Registry of internal routes, external embedded URLs, icons, display order, and badges.
4. **`user_roles`**: Junction table mapping users to assigned roles.
5. **`role_pages`**: Junction table granting page-level permissions to specific roles.
6. **`activity_logs` & `login_activities`**: Immutable audit logs capturing actions, IP addresses, and User-Agents.

---

## 🔌 REST API Reference

Base URL: `http://192.168.1.37:5000/api`

### Authentication (`/api/auth`)
- `POST /api/auth/login`: Authenticate via username/email and password. Returns JWT token.
- `POST /api/auth/logout`: Invalidate session and record audit trail.
- `GET /api/auth/verify`: Verify active JWT token validity and return user details.
- `GET /api/auth/profile`: Fetch authenticated user profile.
- `PUT /api/auth/profile`: Update account username and email.
- `POST /api/auth/change-password`: Change user password with current credential validation.

### Project Control (`/api/control` — Super Admin Only)
- `GET /api/control/status`: Real-time PM2 process list, CPU/RAM stats, DB latency, and scheduled tasks.
- `POST /api/control/action`: Execute operational control (`{ "action": "start" | "stop" | "restart" }`).

### Documentation Hub (`/api/docs` — Super Admin Only)
- `GET /api/docs/sections`: Delivers all 11 verified documentation modules and specifications.

### System Telemetry (`/api/system`)
- `GET /api/system/info`: OS, platform, arch, and Node.js process specifications.
- `GET /api/system/performance`: 50-point historical telemetry series for real-time charts.
- `GET /api/system/health`: Automated health status and memory pressure evaluation.

### Management Modules
- `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- `GET /api/roles`, `POST /api/roles`, `GET /api/roles/:id/pages`, `POST /api/roles/:id/pages`
- `GET /api/pages`, `POST /api/pages`, `GET /api/pages/my-pages`
- `GET /api/menus/tree`, `POST /api/menus/reorder`
- `GET /api/activity/logs`, `GET /api/exports/activity/csv`

---

## 🔐 Environment Configuration

### Backend Configuration (`backend/.env`)
```ini
# Server Configuration
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://localhost:8800

# Database Credentials
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=your_secure_password
DB_NAME=aplos_logix

# Security & Tokens
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
JWT_ISSUER=aploslogix-mes-backend
JWT_AUDIENCE=aploslogix-mes-frontend
```

### Frontend Configuration (`frontend/.env`)
```ini
VITE_API_URL=http://192.168.1.37:5000/api
```

---

## 🔧 Troubleshooting & FAQs

#### 1. `ERR_CONNECTION_REFUSED` on Login
* **Solution**: Ensure PM2 processes are running by typing `pm2 status`. If backend is stopped, run `PM2-Setup\start-app.bat` or `pm2 startOrReload "PM2-Setup\ecosystem.config.cjs" --update-env`.

#### 2. Port Conflict (`EADDRINUSE: 5000` or `8800`)
* **Solution**: Identify and kill the rogue process:
  ```powershell
  netstat -ano | findstr :5000
  taskkill /F /PID <PID>
  pm2 restart all
  ```

#### 3. Scheduled Tasks showing "Unregistered"
* **Solution**: Right-click `PM2-Setup\INSTALL_AND_SETUP.bat` and select **"Run as administrator"**. Windows requires Administrator rights to register boot-level startup tasks (`/sc ONSTART`).

#### 4. Terminal Flashing / CMD Popups
* **Solution**: Built-in `run_silent.vbs` executes all watchdog tasks with `WScript.Shell.Run ..., 0, False`, ensuring 100% invisible background execution.

---

## 📄 License & Intellectual Property

Copyright © 2026 **Aplos Logix**. All rights reserved.  
Proprietary software for internal enterprise operations and manufacturing execution management.