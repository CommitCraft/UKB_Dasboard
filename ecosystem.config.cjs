// ==============================================================
// CMSCRM Root Ecosystem Config
// ==============================================================
// The canonical PM2 config has moved to PM2-Setup/ecosystem.config.cjs
// This file forwards to it so that any existing pm2 commands
// that reference the root still work correctly.
//
// For all PM2 management, prefer using the scripts in PM2-Setup/:
//   PM2-Setup\INSTALL_AND_SETUP.bat  — one-time setup
//   PM2-Setup\start-app.bat          — start both apps
//   PM2-Setup\stop-app.bat           — stop both apps
//   PM2-Setup\restart-app.bat        — restart both apps
//   PM2-Setup\status-app.bat         — show status
// ==============================================================

module.exports = require('./PM2-Setup/ecosystem.config.cjs');
