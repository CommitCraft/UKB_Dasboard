@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CMSCRM — Start Apps

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\config.bat"

echo.
echo  ====================================================
echo    CMSCRM — Starting Applications
echo  ====================================================
echo.

:: Remove maintenance flag so health-check resumes monitoring
if exist "%STARTUP_DIR%\maintenance.flag" (
    del /F /Q "%STARTUP_DIR%\maintenance.flag" >nul 2>&1
    echo [INFO] Maintenance flag cleared — health-check will resume.
    echo.
)

cd /d "%PROJECT_PATH%\PM2-Setup"

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env
if errorlevel 1 (
    echo.
    echo [ERROR] PM2 failed to start the applications.
    echo   Check logs: %LOG_DIR%
    pause & exit /b 1
)

call "%PM2_CMD%" save --force >nul 2>&1

echo.
echo [OK] Apps started.
echo.
call "%PM2_CMD%" status
echo.
pause
exit /b 0
