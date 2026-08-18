@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CMSCRM — PM2 Status

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\config.bat"

echo.
echo  ====================================================
echo    CMSCRM — Current PM2 Status
echo  ====================================================
echo.

call "%PM2_CMD%" status

echo.
echo  ─────────────────────────────────────────────────
echo   Startup task  : %TASK_NAME%
echo   Health task   : %HEALTH_TASK_NAME%
echo   Boot log      : %STARTUP_LOG%
echo   Health log    : %HEALTH_LOG%
echo  ─────────────────────────────────────────────────
echo.

:: Show maintenance mode status
if exist "%STARTUP_DIR%\maintenance.flag" (
    echo  [!] Maintenance mode is ACTIVE
    echo      Health-check is paused. Run start-app.bat to resume.
) else (
    echo  [OK] Health-check is active ^(monitoring every 3 min^)
)

echo.

:: Show task scheduler status
echo  Scheduled task status:
schtasks /query /tn "%TASK_NAME%" /fo TABLE /nh 2>nul
schtasks /query /tn "%HEALTH_TASK_NAME%" /fo TABLE /nh 2>nul

echo.
pause
exit /b 0
