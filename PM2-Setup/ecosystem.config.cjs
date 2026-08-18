// ================================================================
// Aplos_Logix PM2 Ecosystem Configuration
// ================================================================
// This file is the authoritative PM2 process definition.
// Paths are resolved absolutely based on project location.
// Both backend and frontend run as headless Node.js daemon processes.
// No interactive cmd.exe terminal windows are opened.
// ================================================================

const path = require('path');
const PROJECT_ROOT = path.resolve(__dirname, '..');

module.exports = {
  apps: [

    // ─── BACKEND (Node.js / Express) ──────────────────────────
    {
      name: "aplos_logix-backend",
      cwd: path.join(PROJECT_ROOT, "backend"),
      script: "server.js",
      interpreter: "node",

      instances: 1,
      exec_mode: "fork",

      env: {
        NODE_ENV: "production",
        PORT: 5000,
        HOST_IP: "0.0.0.0",
      },

      // ── Auto-restart on crash ───────────────────────────────
      autorestart: true,
      max_restarts: 15,
      min_uptime: "15s",
      restart_delay: 3000,

      // ── Memory guard ────────────────────────────────────────
      max_memory_restart: "512M",

      // ── Logging ─────────────────────────────────────────────
      out_file:   path.join(PROJECT_ROOT, "logs", "backend-out.log"),
      error_file: path.join(PROJECT_ROOT, "logs", "backend-error.log"),
      log_file:   path.join(PROJECT_ROOT, "logs", "backend-combined.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // ── Watcher (disabled in production) ────────────────────
      watch: false,
      ignore_watch: ["node_modules", "logs", "uploads"],

      // ── Kill timeout before force-kill ──────────────────────
      kill_timeout: 5000,
      shutdown_with_message: false,
      listen_timeout: 8000,
    },

    // ─── FRONTEND (Vite server running as headless Node process) ──
    {
      name: "aplos_logix-frontend-dev",
      cwd: path.join(PROJECT_ROOT, "frontend"),
      script: "dev-server.js",
      interpreter: "node",

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
      out_file:   path.join(PROJECT_ROOT, "logs", "frontend-out.log"),
      error_file: path.join(PROJECT_ROOT, "logs", "frontend-error.log"),
      log_file:   path.join(PROJECT_ROOT, "logs", "frontend-combined.log"),
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // ── Watcher (disabled — Vite handles HMR internally) ───
      watch: false,
      ignore_watch: ["node_modules", "dist", "logs"],

      kill_timeout: 5000,
    },

  ],
};
