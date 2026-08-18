@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Aplos_Logix — Health Check

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
call "%SCRIPT_DIR%\config.bat"

echo.
echo  ====================================================
echo    Aplos_Logix — Manual Health Check
echo  ====================================================
echo.

:: Check maintenance flag
if exist "%STARTUP_DIR%\maintenance.flag" (
    echo  [!] Maintenance mode is ACTIVE — apps are intentionally stopped.
    echo      Run start-app.bat to start apps and clear maintenance mode.
    echo.
    pause & exit /b 0
)

:: ── Check backend PM2 status ──
set BACKEND_OK=0
set FRONTEND_OK=0

call "%PM2_CMD%" describe %BACKEND_NAME% 2>nul | findstr /C:"status" | findstr /C:"online" >nul 2>&1
if not errorlevel 1 set BACKEND_OK=1

call "%PM2_CMD%" describe %FRONTEND_NAME% 2>nul | findstr /C:"status" | findstr /C:"online" >nul 2>&1
if not errorlevel 1 set FRONTEND_OK=1

echo  PM2 Process Status:
if "!BACKEND_OK!"=="1"  (echo    [OK]  Backend  ^(%BACKEND_NAME%^)  — ONLINE) else (echo    [!!]  Backend  ^(%BACKEND_NAME%^)  — OFFLINE)
if "!FRONTEND_OK!"=="1" (echo    [OK]  Frontend ^(%FRONTEND_NAME%^) — ONLINE) else (echo    [!!]  Frontend ^(%FRONTEND_NAME%^) — OFFLINE)
echo.

:: ── TCP connectivity tests ──
echo  Connectivity Test:
powershell -NoProfile -Command "try { $t = New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1', %BACKEND_PORT%); $t.Close(); Write-Host '   [OK]  Backend  port %BACKEND_PORT% — REACHABLE' } catch { Write-Host '   [!!]  Backend  port %BACKEND_PORT% — NOT REACHABLE' }" 2>nul
powershell -NoProfile -Command "try { $t = New-Object Net.Sockets.TcpClient; $t.Connect('127.0.0.1', %FRONTEND_PORT%); $t.Close(); Write-Host '   [OK]  Frontend port %FRONTEND_PORT% — REACHABLE' } catch { Write-Host '   [!!]  Frontend port %FRONTEND_PORT% — NOT REACHABLE' }" 2>nul
echo.

if "!BACKEND_OK!"=="1" if "!FRONTEND_OK!"=="1" (
    echo  [OK] Health check PASSED — all apps online.
    echo.
    pause & exit /b 0
)

echo  [WARN] One or more apps are OFFLINE.
echo.
set /p ANSWER=  Attempt recovery now? (Y/N): 
if /i "!ANSWER!" neq "Y" (
    echo  Skipped. Run restart-app.bat to restart manually.
    echo.
    pause & exit /b 1
)

echo.
echo  [INFO] Attempting recovery via PM2...
cd /d "%PROJECT_PATH%\PM2-Setup"
call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env
call "%PM2_CMD%" save --force >nul 2>&1

echo.
echo  [OK] Recovery attempt completed.
echo.
call "%PM2_CMD%" status
echo.
pause
exit /b 0
