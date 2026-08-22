const os = require('os');
const path = require('path');
const backendPackage = require('../../package.json');

/**
 * Controller for Super Admin System Documentation
 * Automatically structured from current active codebase.
 * Security: Strict Super Admin Authorization. Never exposes passwords, .env secrets, or DB credentials.
 */
class DocController {
  async getDocumentation(req, res) {
    try {
      const documentation = {
        title: "Aplos Logix MES — Super Admin System Documentation",
        version: backendPackage.version || "1.0.0",
        lastUpdated: new Date().toISOString(),
        systemInfo: {
          nodeVersion: process.version,
          platform: os.platform(),
          arch: os.arch(),
          environment: process.env.NODE_ENV || 'production'
        },
        sections: [
          {
            id: "overview",
            title: "Project Overview & Architecture",
            icon: "BookOpen",
            summary: "Comprehensive architecture, workflow, communication patterns, and technical stack of Aplos Logix MES.",
            content: `
### 🏢 1. System Overview

**Aplos Logix MES** is an enterprise Manufacturing Execution System (MES) and Master Management Dashboard built on a high-performance MERN-style architecture (Node.js, Express, React 19, MySQL 8.0, and PM2 Process Manager).

The system provides complete multi-role user management, granular page-level RBAC (Role-Based Access Control), real-time CPU/RAM/network hardware telemetry, audit logging, and a native Windows PM2 service supervisor with automatic boot recovery and health watchdog.

---

### 🏛️ 2. Architectural Architecture

\`\`\`text
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
\`\`\`

---

### ⚡ 3. Key Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend UI** | React | 19.1.1 | Modern declarative UI component tree |
| **Build Tool** | Vite | 7.1.9 | Fast development server & optimized production bundling |
| **Styling** | Tailwind CSS | 3.3.6 | Modern utility styling with dark/light mode support |
| **Icons & Visuals**| Lucide React & Chart.js | Latest | Intuitive iconography and live telemetry visualizations |
| **Backend API** | Node.js & Express | v22.x / 4.18 | RESTful routing, rate limiting, and business logic |
| **Database** | MySQL Server | 8.0.x | Relational relational data store with connection pooling |
| **Process Manager**| PM2 & Windows Task Scheduler | Latest | Headless background daemon supervisor & auto-recovery |
`
          },
          {
            id: "user-manual",
            title: "User Manual (Step-by-Step)",
            icon: "FileText",
            summary: "Detailed step-by-step operating instructions for every page and module in the system.",
            content: `
### 📖 Step-by-Step User Manual

---

#### 1. Dashboard & System Analytics (\`/dashboard\`)
* **Live Telemetry Cards**: View active CPU usage percentage, Memory consumption (used vs total), API call rates, and active processes.
* **Performance Charts**: Interactive line charts visualize CPU and RAM load over the last 50 data points with automatic 30s polling.
* **Super Admin Control Center**: Exclusive to \`super_admin\`. Displays backend health, API connectivity, database ping latency, PM2 uptime, restart counts, and Windows watchdog status.
* **Operational Control Buttons**:
  * \`START\`: Launches backend and frontend PM2 daemon processes if stopped.
  * \`STOP\`: Gracefully shuts down applications and writes a maintenance flag (\`C:\\ProgramData\\Aplos_Logix\\maintenance.flag\`) so the watchdog task does not restart it automatically.
  * \`RESTART\`: Safely performs zero-downtime reload of all services.
  * \`REFRESH STATUS\`: Manually polls latest system telemetry without waiting for the auto-refresh interval.

---

#### 2. Users Management (\`/users\`)
* **Viewing Users**: Displays a paginated table of all registered users with username, email, active/inactive status badges, and assigned roles.
* **Creating a User**:
  1. Click **+ Add User** at the top-right.
  2. Fill in **Username** (alphanumeric, hyphens, underscores), **Email Address**, and a secure **Password** (min 8 chars with upper, lower, number).
  3. Select initial **Roles** (Super Admin, Admin, Manager, User).
  4. Click **Save User**.
* **Editing & Status Updates**:
  * Click the **Edit** icon on any user row to change username, email, or assigned roles.
  * Toggle **Status** between \`active\` and \`inactive\` to instantly permit or revoke system login.
* **Assigning Pages Directly**:
  * Click **Manage Pages** modal to assign customized page permissions directly to specific users.

---

#### 3. Roles & Permissions Management (\`/roles\`)
* **Role Registry**: Shows predefined system roles (\`super_admin\`, \`admin\`, \`manager\`, \`user\`) and any custom roles.
* **Granular Page Permission Matrix**:
  1. Click **Permissions / Pages** for a role.
  2. A categorized tree of all available pages is presented.
  3. Check/uncheck pages to allow or disallow access for all users belonging to that role.
  4. Changes take effect immediately without requiring user re-login (the menu tree syncs dynamically).

---

#### 4. Pages Management (\`/pages\`)
* **Dynamic Page Registry**: Add internal system pages or external tool web interfaces.
* **Adding an Internal Page**:
  1. Click **+ Add Page**.
  2. Enter **Name** (e.g. "Reports"), **URL Path** (e.g. \`/reports\`), and choose an icon from the Lucide Icon picker.
  3. Choose whether it is an internal application component or an external embedded URL.
* **Adding an External Iframe Page**:
  1. Set **Is External** to \`true\`.
  2. Enter external target URL (e.g. \`https://grafana.internal.local\`).
  3. The system wraps the URL inside a secure, zoomable sandbox with zoom-in, zoom-out, and fullscreen controls.

---

#### 5. Menu Hierarchy & Navigation Management (\`/menus\`)
* **Visual Navigation Tree**: Organize sidebar items into intuitive sections, parent menus, and nested submenus.
* **Reordering Navigation**:
  * Drag and drop menu items to reorder them or nest subpages under parent categories.
  * Click **Save Menu Order** to commit the new sequence.
* **Badges & Labels**:
  * Attach custom badge text (e.g. \`NEW\`, \`PROD\`, \`V2\`) with color formatting to highlight important modules.

---

#### 6. Flow Editor & Centralized Machine Lines (`/nodered` & `/machine-config`)
* **Interactive Machine Table**:
  * Displays all configured industrial lines, test stations, and Node-RED servers in a clean table format.
  * Shows real-time Active/Standby status, Line Name, IP Address, Port, Protocol (`http`/`https`), and Last Opened timestamp.
* **Top 4 Recent Activity Cards**:
  * Highlights the **Top 4 most recently accessed machines** at the top of the page.
  * Displays relative time badges (*Just now*, *5m ago*, *Yesterday*) and 1-click **Launch Flow** buttons to resume sessions instantly.
* **1-Click Live Flow Launcher**:
  * Clicking any machine row or the **Open Flow** button seamlessly launches the live embedded Node-RED Flow Editor for that specific machine.
  * The canvas view features a **`← Machine List`** return button, an instant **Machine Switcher dropdown**, **Refresh**, **Open Direct in Tab**, and **Fullscreen Canvas** controls.
* **Machine Configuration Hub**:
  * Add, edit, test, and delete machine entries with live URL preview.
  * Setting a machine as **Active** automatically propagates to all flow pages without requiring manual IP or port re-entry.

---

#### 7. Activity & Audit Logs with Exact Timestamps (`/activity`)
* **Precision Audit Trail**:
  * Records user logins, logouts, entity creations, updates, and deletions.
  * Displays **Exact Timestamps with hour:minute:second precision & AM/PM** alongside relative time indicators (*2 minutes ago*).
* **Comprehensive "View Details" Modal**:
  * **Action Overview**: Plain human-readable narrative explaining what operation occurred.
  * **Execution Timestamp**: Full date and time with second-level accuracy.
  * **Triggered By**: Actor username, email, and user ID.
  * **Target Resource**: Resource type (`User`, `Role`, `Page`, `System`, `Machine`) and target entity ID.
  * **Client Information**: Client IP address and full browser User-Agent string.
  * **Detailed Parameters**: Formatted syntax-highlighted JSON viewer with 1-click **"Copy JSON"** and **"Copy Full Log Record"** actions.
* **Compliance Exports**: 1-click export of filtered audit logs into CSV spreadsheet format.
`
          },
          {
            id: "roles-permissions",
            title: "Roles & Permissions Matrix",
            icon: "Shield",
            summary: "Security hierarchy, role definitions, and access control mechanics.",
            content: `
### 🛡️ Roles & Permissions Architecture

The application enforces a multi-tier Role-Based Access Control (RBAC) model at both frontend and backend API layers.

---

### 📊 Role Matrix & Capabilities

| Capability / Module | Super Admin (\`super_admin\`) | Admin (\`admin\`) | Manager (\`manager\`) | Standard User (\`user\`) |
|---|:---:|:---:|:---:|:---:|
| **System Dashboard & Graphs** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Assigned Pages |
| **PM2 Start/Stop/Restart Controls** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **System Documentation (\`/docs\`)** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden | ❌ Forbidden |
| **User CRUD & Status Toggles** | ✅ Full Access | ✅ Full Access | ⚠️ View Only | ❌ Forbidden |
| **Role & Permission Matrix** | ✅ Full Access | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Pages & Dynamic Menu Manager** | ✅ Full Access | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Activity Audit Logs & Exports** | ✅ Full Access | ✅ Full Access | ⚠️ View Only | ❌ Forbidden |
| **Profile & Security Settings** | ✅ Full Access | ✅ Full Access | ✅ Full Access | ✅ Full Access |

---

### 🔒 Backend Middleware Enforcers

1. **\`auth\`**: Validates Bearer JWT signature, verifies issuer (\`aploslogix-mes-backend\`), checks token expiration, and verifies user status is \`active\`.
2. **\`requireSuperAdmin\`**: Ensures the authenticated user possesses the \`super_admin\` role. Returns \`403 Forbidden\` otherwise.
3. **\`requireAdmin\`**: Allows either \`super_admin\` or \`admin\`.
4. **\`requireAssignedPages\`**: Dynamically queries the database (\`role_pages\` & \`user_roles\`) to verify whether the requesting user has been explicitly granted access to the target route.
`
          },
          {
            id: "frontend",
            title: "Frontend Architecture & Components",
            icon: "Layout",
            summary: "React 19 single-page app structure, context providers, and UI component hierarchy.",
            content: `
### ⚛️ Frontend Architecture

The frontend is a modern single-page application built with React 19 and bundled via Vite 7.

---

### 📁 Directory Layout

\`\`\`text
frontend/
├── dev-server.js              # Dedicated headless Vite dev-server runner for PM2
├── vite.config.js             # Vite configuration with React plugin & network host
├── src/
│   ├── main.jsx               # Application entrypoint
│   ├── App.jsx                # Route definitions with v7 Future Flags & ProtectedRoute
│   ├── context/
│   │   ├── AuthContext.jsx    # Session state, login/logout, role helpers (isSuperAdmin)
│   │   └── ThemeContext.jsx   # Light/dark mode toggle & HTML class provider
│   ├── pages/
│   │   ├── DashboardPage.jsx  # Main telemetry dashboard + ProjectControlPanel
│   │   ├── UsersPage.jsx      # User table, modal CRUD, page permissions
│   │   ├── RolesPage.jsx      # Role manager and page permission matrix
│   │   ├── PagesPage.jsx      # Dynamic page registry & icon selector
│   │   ├── MenuManagementPage.jsx # Menu hierarchy tree & badge editor
│   │   ├── ActivityLogsPage.jsx   # Audit logs with filter & CSV export
│   │   ├── DocsPage.jsx       # Super Admin Documentation Hub
│   │   └── LoginPage.jsx      # Modern login card with validation
│   ├── components/
│   │   ├── Layout/            # Responsive sidebar, NavItemTree, Header, Footer
│   │   ├── ProjectControlPanel.jsx # Super Admin live PM2 status & action buttons
│   │   ├── EnhancedSystemInformation.jsx # Hardware, RAM, Network stats
│   │   ├── EnhancedSystemPerformance.jsx # Chart.js performance telemetry
│   │   └── LoadingSpinner.jsx # Clean loading states
│   └── utils/
│       └── api.js             # Axios instance with interceptors & endpoints registry
\`\`\`

---

### 🔑 Authentication & Token Persistence

Session tokens are stored with dual redundancy in both \`localStorage\` and \`Cookies\` using the primary key \`aplos_logix-token\` (with legacy fallback to \`cmscrm-token\`).

Axios interceptor automatically attaches:
\`\`\`javascript
headers['Authorization'] = 'Bearer ' + token;
\`\`\`
`
          },
          {
            id: "backend",
            title: "Backend Architecture & Security",
            icon: "Server",
            summary: "Express.js RESTful API, security middlewares, controllers, and models.",
            content: `
### 🛠️ Backend Architecture

The backend is built with Express.js running on Node.js v22.x in a clean, modular Model-Controller-Route architecture.

---

### 📁 Directory Layout

\`\`\`text
backend/
├── server.js                  # Master Express server initialization & lifecycle
├── src/
│   ├── config/
│   │   └── db.js              # MySQL connection pool with deterministic .env loader
│   ├── middleware/
│   │   ├── auth.js            # JWT validation & requireSuperAdmin / requireAdmin
│   │   ├── activityLogger.js  # Automatic audit logging into database
│   │   ├── errorHandler.js    # Centralized error handler & formatting
│   │   └── validation.js      # Input validation using express-validator
│   ├── models/
│   │   ├── user.js            # User queries (find by email/username, create, update)
│   │   ├── role.js            # Role CRUD and page assignment mapping
│   │   ├── page.js            # Page registry and hierarchy tree
│   │   └── activityLog.js     # Audit log storage and export filters
│   ├── controllers/
│   │   ├── authController.js  # Login, logout, profile update, password change
│   │   ├── controlController.js # PM2 live status & START/STOP/RESTART execution
│   │   ├── docController.js   # Documentation delivery & Super Admin docs API
│   │   └── systemController.js# CPU, Memory, Network hardware statistics
│   ├── routes/
│   │   ├── index.js           # Main router mounting all module endpoints
│   │   ├── authRoutes.js      # /api/auth
│   │   ├── controlRoutes.js   # /api/control (Super Admin only)
│   │   ├── docRoutes.js       # /api/docs (Super Admin only)
│   │   └── systemRoutes.js    # /api/system
│   └── utils/
│       └── enhancedSystemMonitor.js # Hardware metrics & PM2 process listing
\`\`\`

---

### 🔒 Security Layers Implemented

1. **Helmet**: Sets HTTP security headers, Cross-Origin Resource Policy, and disables \`X-Powered-By\`.
2. **Dynamic CORS**: Whitelists local network IPs (\`192.168.x.x\`, \`localhost\`, \`127.0.0.1\`) and specific origins.
3. **Rate Limiting**: General endpoints protected at 300 req / 15 min; Auth endpoints protected at 10 req / 15 min.
4. **Parameterized SQL**: All database queries use prepared statements with \`mysql2/promise\` to prevent SQL injection.
5. **Password Hashing**: Passwords are encrypted using \`bcryptjs\` with salt rounds of 10.
`
          },
          {
            id: "api",
            title: "Complete REST API Reference",
            icon: "Code",
            summary: "Detailed API documentation for all available endpoints, parameters, and responses.",
            content: `
### 🔌 REST API Reference

Base URL: \`http://192.168.1.37:5000/api\`

---

#### 1. Authentication Endpoints (\`/api/auth\`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| \`POST\` | \`/auth/login\` | Public | Login with email or username + password. Returns JWT token & user data. |
| \`POST\` | \`/auth/logout\` | Authenticated | Invalidate current session and log user logout activity. |
| \`GET\` | \`/auth/verify\` | Authenticated | Verify active JWT token validity and return current user profile. |
| \`GET\` | \`/auth/profile\` | Authenticated | Retrieve authenticated user profile and assigned roles. |
| \`PUT\` | \`/auth/profile\` | Authenticated | Update username or email for current account. |
| \`POST\` | \`/auth/change-password\` | Authenticated | Update password by validating current password first. |

---

#### 2. Project Control Endpoints (\`/api/control\` — Super Admin Only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| \`GET\` | \`/control/status\` | Super Admin | Get live project status: PM2 processes, CPU, RAM, DB ping, uptime, tasks. |
| \`POST\` | \`/control/action\` | Super Admin | Execute control action. Body: \`{ "action": "start" \| "stop" \| "restart" }\`. |

---

#### 3. Documentation Endpoints (\`/api/docs\` — Super Admin Only)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| \`GET\` | \`/docs/sections\` | Super Admin | Fetch complete system documentation tree and technical manuals. |

---

#### 4. System Telemetry Endpoints (\`/api/system\` — Admin / Super Admin)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| \`GET\` | \`/system/info\` | Admin | Detailed OS, hostname, platform, and process info. |
| \`GET\` | \`/system/processes\` | Admin | PM2 process metrics (CPU, RAM, PID, uptime, restarts). |
| \`GET\` | \`/system/health\` | Admin | Automated health evaluation and memory pressure analysis. |
| \`GET\` | \`/system/cpu\` | Admin | Per-core and aggregate CPU load percentages. |
| \`GET\` | \`/system/memory\` | Admin | Total, free, used RAM and Node heap usage metrics. |
| \`GET\` | \`/system/network\` | Admin | Local network interfaces, IPv4 addresses, and netmasks. |
| \`GET\` | \`/system/performance\` | Admin | 50-point historical telemetry series for Chart.js rendering. |

---

#### 5. Management Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| \`GET\` | \`/users\` | Admin | List all registered users with pagination & search. |
| \`POST\` | \`/users\` | Admin | Create a new user with assigned roles. |
| \`GET\` | \`/roles\` | Admin | List all system roles and page assignment mappings. |
| \`GET\` | \`/pages\` | Admin | List all registered pages and route definitions. |
| \`GET\` | \`/menus/tree\` | Authenticated | Get personalized navigation tree for the current user. |
| \`GET\` | \`/activity/logs\`| Admin | Fetch filtered audit logs and user activity records. |
| \`GET\` | \`/exports/activity/csv\` | Admin | Export activity audit trail in CSV spreadsheet format. |
`
          },
          {
            id: "database",
            title: "Database Tables & Schema",
            icon: "Database",
            summary: "Complete MySQL database table definitions, foreign keys, and indexes.",
            content: `
### 🗄️ Database Tables & Schema

Database Engine: **MySQL 8.0 (InnoDB)**  
Default Character Set: **utf8mb4 (utf8mb4_unicode_ci)**

---

### 📋 Table Specifications

#### 1. \`users\`
Stores user account records, credentials, and account statuses.
\`\`\`sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_status (status)
) ENGINE=InnoDB;
\`\`\`

#### 2. \`roles\`
Defines security roles in the application.
\`\`\`sql
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
\`\`\`

#### 3. \`pages\`
Registry of all internal routes, external pages, and dynamic links.
\`\`\`sql
CREATE TABLE pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  icon VARCHAR(50) DEFAULT 'Globe',
  is_external TINYINT(1) DEFAULT 0,
  status ENUM('active', 'inactive') DEFAULT 'active',
  type VARCHAR(50) DEFAULT 'menu',
  parent_id INT NULL,
  display_order INT DEFAULT 0,
  badge_label VARCHAR(50) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
\`\`\`

#### 4. \`user_roles\` & \`role_pages\` (Junction Tables)
Maps users to roles and roles to page permissions.
\`\`\`sql
CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE role_pages (
  role_id INT NOT NULL,
  page_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, page_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
) ENGINE=InnoDB;
\`\`\`

#### 5. \`activity_logs\` & \`login_activities\`
Audit trail of user actions and login history.
\`\`\`sql
CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50) NULL,
  details JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;
\`\`\`
`
          },
          {
            id: "pm2-deployment",
            title: "PM2 Setup & Windows Deployment",
            icon: "Cpu",
            summary: "Windows PM2 service management, batch scripts, auto-start, and watchdog health-check.",
            content: `
### ⚙️ PM2 Windows Production Setup

The system includes a production-ready Windows automation suite located in the \`PM2-Setup/\` directory.

---

### 📂 PM2-Setup File Architecture

| File | Purpose |
|---|---|
| [\`PM2-Setup/config.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/config.bat) | **Single Editable Config**: Central configuration file defining project path and ports. |
| [\`PM2-Setup/ecosystem.config.cjs\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/ecosystem.config.cjs) | Master PM2 ecosystem defining headless backend & frontend daemon processes. |
| [\`PM2-Setup/INSTALL_AND_SETUP.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/INSTALL_AND_SETUP.bat) | One-click setup: installs PM2, registers startup task & 3-min watchdog in Task Scheduler. |
| [\`PM2-Setup/start-app.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/start-app.bat) | Idempotent launcher: starts or reloads processes and saves PM2 state. |
| [\`PM2-Setup/stop-app.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/stop-app.bat) | Stops applications and sets maintenance flag so watchdog does not restart them. |
| [\`PM2-Setup/restart-app.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/restart-app.bat) | Performs zero-downtime reload of all services. |
| [\`PM2-Setup/status-app.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/status-app.bat) | Terminal status monitor showing process table, CPU, RAM, and logs. |
| [\`PM2-Setup/health-check.bat\`](file:///c:/Users/DELL/Desktop/MERN%20Project%20file/Master_Dashboard/CMSCRM_SriCity/PM2-Setup/health-check.bat) | Watchdog script executed every 3 minutes by Windows Task Scheduler. |

---

### 🕒 Windows Scheduled Tasks

1. **\`Aplos_Logix-PM2-Startup\`**:
   - Trigger: At Windows system boot (with 90s delay to ensure MySQL and network services are online).
   - Action: Executes \`C:\\ProgramData\\Aplos_Logix\\startup.bat\` to resurrect PM2 processes.
2. **\`Aplos_Logix-PM2-HealthCheck\`**:
   - Trigger: Every 3 minutes indefinitely.
   - Action: Checks if backend responds on \`http://127.0.0.1:5000/api/system/health\`. If unreachable and maintenance mode is NOT active, it automatically revives the PM2 processes.

---

### 💻 Useful PM2 Commands

\`\`\`bash
# Check status of processes
pm2 status

# View live streaming logs
pm2 logs

# Zero-downtime restart
pm2 restart all

# Save process state
pm2 save --force
\`\`\`
`
          },
          {
            id: "project-status",
            title: "Project Status & Live Controls",
            icon: "Activity",
            summary: "Super Admin operational control panel, telemetry indicators, and safety guards.",
            content: `
### 🎛️ Project Status & Control Panel

The **Project Status & Control Panel** is integrated into the Super Admin Dashboard (\`/dashboard\`) and provides real-time infrastructure controls.

---

### 🚥 Status Indicators & Telemetry

* **Overall Status Badge**:
  * \`ONLINE\` (Green): Backend, Frontend, and Database all operating normally.
  * \`DEGRADED\` (Yellow): One subsystem is down or experiencing high load.
  * \`MAINTENANCE\` (Blue): Maintenance mode active via intentional stop.
  * \`OFFLINE\` / \`ERROR\` (Red): Backend service is halted.
* **Database Cluster**: Real-time ping latency check directly to MySQL.
* **Process Watch**: Process ID (PID), memory usage in MB, and individual process uptime.
* **System Resource Gauges**: Visual circular progress bars for CPU and RAM utilization.

---

### 🛡️ Safety Guards & Maintenance Mode

1. **Action Debounce**: All control buttons are disabled with loading spinners while a control action is in progress to prevent race conditions or duplicate commands.
2. **Confirmation Modals**: \`STOP\` and \`RESTART\` require explicit user confirmation before executing.
3. **Maintenance Flag Protocol**: When stopped via the panel or \`stop-app.bat\`, the file \`C:\\ProgramData\\Aplos_Logix\\maintenance.flag\` is written. The automatic 3-minute watchdog detects this flag and refrains from starting the application until an explicit \`START\` action is initiated.
`
          },
          {
            id: "troubleshooting",
            title: "Troubleshooting Guide",
            icon: "AlertTriangle",
            summary: "Diagnostic steps and solutions for common operational and deployment issues.",
            content: `
### 🔧 Troubleshooting & Diagnostics

---

#### 1. \`net::ERR_CONNECTION_REFUSED\` on Port 5000
* **Cause**: Backend service is stopped, failed to bind to \`0.0.0.0\`, or \`.env\` file was not found in PM2 daemon directory.
* **Solution**:
  1. Check PM2 status: \`pm2 status\`
  2. Inspect backend logs: \`pm2 logs aplos_logix-backend --lines 50\`
  3. Reload with absolute paths: \`pm2 startOrReload "PM2-Setup\\ecosystem.config.cjs" --update-env\`

---

#### 2. Port Already in Use (\`EADDRINUSE: 5000\` or \`8800\`)
* **Cause**: A stray Node process is occupying port 5000 or 8800 outside PM2.
* **Solution**:
  \`\`\`powershell
  # Find process occupying port 5000
  netstat -ano | findstr :5000
  # Terminate process by PID
  taskkill /F /PID <PID>
  # Restart PM2
  pm2 restart all
  \`\`\`

---

#### 3. Database Connection Failed (\`ER_ACCESS_DENIED_ERROR\`)
* **Cause**: MySQL password or user mismatch in \`backend/.env\`.
* **Solution**:
  1. Verify credentials in \`backend/.env\` (\`DB_HOST\`, \`DB_USER\`, \`DB_PASS\`, \`DB_NAME\`).
  2. Test connection in command line: \`mysql -u kuns -p -h 127.0.0.1\`

---

#### 4. Terminal Flashing / Console Window Popups
* **Solution**:
  * All child process commands in \`controlController.js\` utilize \`{ windowsHide: true }\` and \`execFilePromise\`.
  * Frontend dev server is executed directly as headless Node process via \`dev-server.js\`.
`
          },
          {
            id: "developer-guide",
            title: "Developer & Maintenance Guide",
            icon: "Settings",
            summary: "Guidelines for extending the codebase, adding new pages, database migrations, and maintenance.",
            content: `
### 👨‍💻 Developer & Maintenance Guide

---

#### 1. Adding a New Page & API Endpoint

1. **Create Backend Route & Controller**:
   * Add controller in \`backend/src/controllers/yourController.js\`.
   * Add route in \`backend/src/routes/yourRoutes.js\` and mount in \`backend/src/routes/index.js\`.
2. **Create Frontend Page**:
   * Add component in \`frontend/src/pages/YourPage.jsx\`.
   * Register route in \`frontend/src/App.jsx\` with \`<ProtectedRoute requiredPath="/your-path">\`.
3. **Register Page in Database**:
   * Open **Pages Management** (\`/pages\`) as Super Admin and click **+ Add Page**.
   * Enter URL path \`/your-path\` and select an icon.
   * Open **Roles Management** (\`/roles\`) and check the page for authorized roles.

---

#### 2. Database Migrations
* Database table definitions are initialized automatically in \`backend/src/config/db.js\` inside \`initializeDatabase()\`.
* New tables should use \`CREATE TABLE IF NOT EXISTS\` with \`ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci\`.

---

#### 3. Log Maintenance
* PM2 logs are saved in the project root \`logs/\` directory:
  * \`logs/backend-out.log\`
  * \`logs/backend-error.log\`
  * \`logs/frontend-out.log\`
  * \`logs/frontend-error.log\`
* Logs can be trimmed or cleared safely at any time while processes are running.
`
          }
        ]
      };

      return res.status(200).json({
        success: true,
        data: documentation
      });
    } catch (error) {
      console.error('Error generating documentation:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate documentation: ' + error.message
      });
    }
  }
}

module.exports = new DocController();
