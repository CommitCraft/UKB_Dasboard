@echo off
:: ==============================================================
:: Aplos_Logix Configuration — Edit this file ONLY when paths change
:: ==============================================================
::
:: If you move the project to a different folder, update PROJECT_PATH here.
:: All other scripts read their values from this file automatically.
::

:: ─── PROJECT LOCATION ─────────────────────────────────────────
set "PROJECT_PATH=C:\Users\DELL\Desktop\MERN Project file\Master_Dashboard\CMSCRM_SriCity"

:: ─── APPLICATION NAMES (must match ecosystem.config.cjs) ──────
set "BACKEND_NAME=aplos_logix-backend"
set "FRONTEND_NAME=aplos_logix-frontend-dev"

:: ─── ECOSYSTEM CONFIG ─────────────────────────────────────────
set "ECOSYSTEM=%PROJECT_PATH%\PM2-Setup\ecosystem.config.cjs"

:: ─── LOG DIRECTORY ────────────────────────────────────────────
set "LOG_DIR=%PROJECT_PATH%\logs"

:: ─── PM2 PATHS (auto-detected, do not normally change) ────────
set "NODE_DIR=C:\Program Files\nodejs"
set "PM2_CMD=C:\Users\DELL\AppData\Roaming\npm\pm2.cmd"
set "PM2_DIR=C:\Users\DELL\AppData\Roaming\npm"

:: ─── PM2 HOME (shared data store) ─────────────────────────────
::   Uses the current user's default .pm2 folder.
::   Change to C:\ProgramData\Aplos_Logix\pm2 for SYSTEM-account usage.
set "PM2_HOME=%USERPROFILE%\.pm2"

:: ─── WINDOWS STARTUP TASK ─────────────────────────────────────
set "TASK_NAME=Aplos_Logix-PM2-Startup"
set "HEALTH_TASK_NAME=Aplos_Logix-PM2-HealthCheck"

:: ─── STARTUP SCRIPT (written to a stable, short path) ─────────
set "STARTUP_DIR=C:\ProgramData\Aplos_Logix"
set "SILENT_RUNNER=%STARTUP_DIR%\run_silent.vbs"
set "BOOT_SCRIPT=%STARTUP_DIR%\startup.cmd"
set "HEALTH_SCRIPT=%STARTUP_DIR%\health-check.cmd"
set "STARTUP_LOG=%STARTUP_DIR%\startup.log"
set "HEALTH_LOG=%STARTUP_DIR%\health-check.log"

:: ─── PORTS (for health-check connectivity test) ───────────────
set "BACKEND_PORT=5000"
set "FRONTEND_PORT=8800"

:: ─── STARTUP DELAY (MM:SS after Windows boot) ─────────────────
set "STARTUP_DELAY=0001:30"
