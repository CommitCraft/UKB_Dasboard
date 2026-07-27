@echo off
title PM2 Auto-Start Fix Script
echo ==========================================
echo     FIXING PM2 / NODE ISSUES
echo ==========================================
echo.

:: 🧹 Kill any stuck Node or PM2 processes
echo Killing stuck Node and PM2 processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM pm2.exe >nul 2>&1
echo Done.
echo.

:: 🧼 Delete old PM2 cache (fixes rpc.sock issue)
echo Removing old PM2 cache...
rd /s /q "C:\Users\MES WM\.pm2"
echo Done.
echo.

:: ⚙️ Reinstall PM2 globally and refresh daemon
echo Reinstalling PM2...
npm install -g pm2
pm2 update
echo Done.
echo.

:: 🚀 Start your CMSCRM backend
echo Starting CMSCRM backend...
cd "C:\Users\MES WM\Dashborad_server-main\CMSCRM"
pm2 start ecosystem.config.cjs
echo Done.
echo.

:: 💾 Save process list so PM2 restarts after reboot
echo Saving PM2 autostart list...
pm2 save
echo Done.
echo.

echo ==========================================
echo           ALL STEPS COMPLETED
echo     PM2 WILL NOW AUTO-START AFTER REBOOT
echo ==========================================
pause
