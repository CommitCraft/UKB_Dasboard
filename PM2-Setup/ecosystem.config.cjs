// ================================================================
// CMSCRM PM2 Ecosystem Configuration
// ================================================================
// This file is the authoritative PM2 process definition.
// Paths are relative to the PROJECT_PATH (parent of PM2-Setup/).
// Run from: PM2-Setup/INSTALL_AND_SETUP.bat or pm2 commands.
// ================================================================

module.exports = {
  apps: [

    // ─── BACKEND (Node.js / Express) ──────────────────────────
    {
      name: "cmscrm-backend",
      cwd: "../backend",
      script: "server.js",
      interpreter: "node",

      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // ── Auto-restart on crash ───────────────────────────────
      autorestart: true,
      max_restarts: 15,
      min_uptime: "15s",          // Must stay up 15s to count as successful start
      restart_delay: 3000,        // Wait 3s between restart attempts

      // ── Memory guard ────────────────────────────────────────
      max_memory_restart: "512M",

      // ── Logging ─────────────────────────────────────────────
      out_file:   "../logs/backend-out.log",
      error_file: "../logs/backend-error.log",
      log_file:   "../logs/backend-combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // ── Watcher (disabled in production) ────────────────────
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],

      // ── Kill timeout before force-kill ──────────────────────
      kill_timeout: 5000,

      // ── Graceful shutdown signal ─────────────────────────────
      shutdown_with_message: false,
      listen_timeout: 8000,
    },

    // ─── FRONTEND (Vite dev server — LAN accessible) ──────────
    {
      name: "cmscrm-frontend-dev",
      cwd: "../frontend",
      script: "C:\\Windows\\System32\\cmd.exe",
      args: "/c npm run dev -- --host 0.0.0.0 --port 8800",
      interpreter: "none",

      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "development",
        VITE_HOST: "0.0.0.0",
        VITE_PORT: "8800",
      },

      // ── Auto-restart on crash ───────────────────────────────
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,

      // ── Memory guard ────────────────────────────────────────
      max_memory_restart: "512M",

      // ── Logging ─────────────────────────────────────────────
      out_file:   "../logs/frontend-out.log",
      error_file: "../logs/frontend-error.log",
      log_file:   "../logs/frontend-combined.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // ── Watcher (disabled — Vite has its own HMR) ───────────
      watch: false,
      ignore_watch: ["node_modules", "dist", "logs"],

      kill_timeout: 5000,
    },

  ],
};
