@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CMSCRM — Stop Apps

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\config.bat"

echo.
echo  ====================================================
echo    CMSCRM — Stopping Applications
echo  ====================================================
echo.
echo  NOTE: This sets a maintenance flag so the health-check
echo        task will NOT immediately restart the apps.
echo        Run start-app.bat when you are ready to resume.
echo.

:: Set maintenance flag — prevents health-check from auto-restarting
if not exist "%STARTUP_DIR%\" mkdir "%STARTUP_DIR%" >nul 2>&1
echo MAINTENANCE > "%STARTUP_DIR%\maintenance.flag"
echo [OK] Maintenance flag set — health-check paused.
echo.

call "%PM2_CMD%" stop "%BACKEND_NAME%"  >nul 2>&1
call "%PM2_CMD%" stop "%FRONTEND_NAME%" >nul 2>&1

echo.
echo [OK] Applications stopped.
echo.
call "%PM2_CMD%" status
echo.
echo  To restart: run PM2-Setup\start-app.bat
echo.
pause
exit /b 0
