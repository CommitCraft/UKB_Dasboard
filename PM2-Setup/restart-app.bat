@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Aplos_Logix — Restart Apps

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\config.bat"

echo.
echo  ====================================================
echo    Aplos_Logix — Restarting Applications
echo  ====================================================
echo.

:: Clear maintenance flag so health-check resumes after restart
if exist "%STARTUP_DIR%\maintenance.flag" (
    del /F /Q "%STARTUP_DIR%\maintenance.flag" >nul 2>&1
    echo [INFO] Maintenance flag cleared.
)

cd /d "%PROJECT_PATH%\PM2-Setup"

call "%PM2_CMD%" restart "%BACKEND_NAME%"
call "%PM2_CMD%" restart "%FRONTEND_NAME%"

call "%PM2_CMD%" save --force >nul 2>&1

echo.
echo [OK] Applications restarted.
echo.
call "%PM2_CMD%" status
echo.
pause
exit /b 0
