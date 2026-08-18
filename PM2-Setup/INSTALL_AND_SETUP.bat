@echo off
setlocal EnableExtensions EnableDelayedExpansion
title Aplos_Logix PM2 Setup — Run as Administrator

color 0A
echo.
echo  ====================================================================
echo    Aplos_Logix PM2 SETUP — Windows Auto-Start Configuration
echo  ====================================================================
echo.
echo  This script will:
echo    1. Verify prerequisites (Node.js, npm, PM2)
echo    2. Install PM2 globally if missing
echo    3. Start both apps (backend + frontend) via PM2
echo    4. Save PM2 process list (pm2 save)
echo    5. Create a Windows startup task (auto-start on reboot)
echo    6. Create a health-check task (auto-restart on failure)
echo    7. Verify the application is running
echo.
echo  Safe to run multiple times — will NOT create duplicate processes.
echo  ====================================================================
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 0: Load config
:: ──────────────────────────────────────────────────────────────

set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

call "%SCRIPT_DIR%\config.bat"
if errorlevel 1 (
    echo [ERROR] Could not load config.bat from: %SCRIPT_DIR%
    pause & exit /b 1
)

echo [CONFIG] Project path : %PROJECT_PATH%
echo [CONFIG] Ecosystem    : %ECOSYSTEM%
echo [CONFIG] PM2 Home     : %PM2_HOME%
echo [CONFIG] Startup dir  : %STARTUP_DIR%
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 1: Require Administrator
:: ──────────────────────────────────────────────────────────────

fltmc >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] This script must be run as Administrator.
    echo.
    echo   Right-click INSTALL_AND_SETUP.bat
    echo   Select: Run as administrator
    echo.
    pause & exit /b 1
)
echo [OK] Administrator rights confirmed.
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 2: Validate project directory
:: ──────────────────────────────────────────────────────────────

if not exist "%PROJECT_PATH%\" (
    color 0C
    echo [ERROR] Project directory not found:
    echo         %PROJECT_PATH%
    echo.
    echo   Update PROJECT_PATH in PM2-Setup\config.bat
    echo.
    pause & exit /b 1
)
echo [OK] Project directory found.

if not exist "%ECOSYSTEM%" (
    color 0C
    echo [ERROR] Ecosystem config not found:
    echo         %ECOSYSTEM%
    echo.
    pause & exit /b 1
)
echo [OK] ecosystem.config.cjs found.
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 3: Check Node.js
:: ──────────────────────────────────────────────────────────────

where node.exe >nul 2>&1
if errorlevel 1 (
    color 0C
    echo [ERROR] Node.js is not installed or not in PATH.
    echo   Download from: https://nodejs.org/
    pause & exit /b 1
)

for /f "delims=" %%V in ('node --version 2^>nul') do set "NODE_VER=%%V"
echo [OK] Node.js %NODE_VER% found at: %NODE_DIR%
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 4: Install PM2 if missing
:: ──────────────────────────────────────────────────────────────

if not exist "%PM2_CMD%" (
    echo [INFO] PM2 not found. Installing globally...
    call npm install -g pm2
    if errorlevel 1 (
        color 0C
        echo [ERROR] PM2 installation failed.
        pause & exit /b 1
    )
    echo [OK] PM2 installed.
) else (
    for /f "delims=" %%V in ('call "%PM2_CMD%" --version 2^>nul') do set "PM2_VER=%%V"
    echo [OK] PM2 v!PM2_VER! found at: %PM2_CMD%
)
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 5: Create log and startup directories
:: ──────────────────────────────────────────────────────────────

if not exist "%LOG_DIR%\" (
    mkdir "%LOG_DIR%" >nul 2>&1
    echo [OK] Log directory created: %LOG_DIR%
) else (
    echo [OK] Log directory exists: %LOG_DIR%
)

if not exist "%STARTUP_DIR%\" (
    mkdir "%STARTUP_DIR%" >nul 2>&1
    echo [OK] Startup directory created: %STARTUP_DIR%
) else (
    echo [OK] Startup directory exists: %STARTUP_DIR%
)
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 6: Start or reload apps via PM2 (idempotent)
:: ──────────────────────────────────────────────────────────────

echo [STEP 6] Starting applications via PM2...
echo.

pushd "%PROJECT_PATH%\PM2-Setup"
if errorlevel 1 (
    echo [ERROR] Cannot cd to PM2-Setup directory.
    pause & exit /b 1
)

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env
if not errorlevel 1 goto :PM2_STARTED

echo.
echo [WARN] PM2 startOrReload failed. Attempting PM2 daemon repair...
call "%PM2_CMD%" kill >nul 2>&1
if exist "%PM2_HOME%\rpc.sock" del /F /Q "%PM2_HOME%\rpc.sock" >nul 2>&1
if exist "%PM2_HOME%\pub.sock" del /F /Q "%PM2_HOME%\pub.sock" >nul 2>&1
if exist "%PM2_HOME%\pm2.pid"  del /F /Q "%PM2_HOME%\pm2.pid"  >nul 2>&1
timeout /t 3 /nobreak >nul

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env
if errorlevel 1 (
    popd
    color 0C
    echo [ERROR] PM2 could not start the applications.
    echo   Check: %LOG_DIR%\backend-error.log
    pause & exit /b 1
)

:PM2_STARTED
echo.
echo [OK] Applications started via PM2.

:: ──────────────────────────────────────────────────────────────
:: STEP 7: Save PM2 process list
:: ──────────────────────────────────────────────────────────────

echo.
echo [STEP 7] Saving PM2 process list (pm2 save)...
call "%PM2_CMD%" save --force
if errorlevel 1 (
    popd
    echo [ERROR] pm2 save failed.
    pause & exit /b 1
)
echo [OK] PM2 process list saved.
popd
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 8: Create Windows startup boot script
:: ──────────────────────────────────────────────────────────────

echo [STEP 8] Writing startup boot script...

> "%BOOT_SCRIPT%" (
    echo @echo off
    echo setlocal EnableExtensions EnableDelayedExpansion
    echo.
    echo set "PM2_HOME=%PM2_HOME%"
    echo set "PATH=%NODE_DIR%;%PM2_DIR%;%%PATH%%"
    echo set "PM2_CMD=%PM2_CMD%"
    echo set "ECOSYSTEM=%ECOSYSTEM%"
    echo set "PROJECT_PATH=%PROJECT_PATH%"
    echo set "LOG=%STARTUP_LOG%"
    echo.
    echo echo ==================================================  ^^^>^^^> "%%LOG%%"
    echo echo [%%date%% %%time%%] Aplos_Logix startup initiated.       ^^^>^^^> "%%LOG%%"
    echo.
    echo if not exist "%%PROJECT_PATH%%\" (
    echo     echo [%%date%% %%time%%] ERROR: Project not found: %%PROJECT_PATH%% ^^^>^^^> "%%LOG%%"
    echo     exit /b 2
    echo ^)
    echo.
    echo cd /d "%%PROJECT_PATH%%\PM2-Setup"
    echo.
    echo set /a ATTEMPT=0
    echo :RETRY
    echo set /a ATTEMPT+=1
    echo echo [%%date%% %%time%%] PM2 start attempt !ATTEMPT!. ^^^>^^^> "%%LOG%%"
    echo call "%%PM2_CMD%%" startOrReload "%%ECOSYSTEM%%" --update-env ^^^>^^^> "%%LOG%%" 2^^^>^^^>^^^&1
    echo if not errorlevel 1 goto :SAVE
    echo if !ATTEMPT! GEQ 3 goto :FAILED
    echo echo [%%date%% %%time%%] Retrying in 20s... ^^^>^^^> "%%LOG%%"
    echo timeout /t 20 /nobreak ^^^>nul
    echo goto :RETRY
    echo.
    echo :SAVE
    echo call "%%PM2_CMD%%" save --force ^^^>^^^> "%%LOG%%" 2^^^>^^^>^^^&1
    echo echo [%%date%% %%time%%] Aplos_Logix startup completed OK. ^^^>^^^> "%%LOG%%"
    echo exit /b 0
    echo.
    echo :FAILED
    echo echo [%%date%% %%time%%] ERROR: All startup attempts failed. ^^^>^^^> "%%LOG%%"
    echo call "%%PM2_CMD%%" status ^^^>^^^> "%%LOG%%" 2^^^>^^^>^^^&1
    echo exit /b 1
)

if not exist "%BOOT_SCRIPT%" (
    echo [ERROR] Startup script could not be written: %BOOT_SCRIPT%
    pause & exit /b 1
)
echo [OK] Startup script created: %BOOT_SCRIPT%
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 9: Create health-check script
:: ──────────────────────────────────────────────────────────────

echo [STEP 9] Writing health-check script...

> "%HEALTH_SCRIPT%" (
    echo @echo off
    echo setlocal EnableExtensions EnableDelayedExpansion
    echo.
    echo set "PM2_HOME=%PM2_HOME%"
    echo set "PATH=%NODE_DIR%;%PM2_DIR%;%%PATH%%"
    echo set "PM2_CMD=%PM2_CMD%"
    echo set "ECOSYSTEM=%ECOSYSTEM%"
    echo set "LOG=%HEALTH_LOG%"
    echo set "BACKEND_NAME=%BACKEND_NAME%"
    echo set "FRONTEND_NAME=%FRONTEND_NAME%"
    echo set "MAINTENANCE_FLAG=%STARTUP_DIR%\maintenance.flag"
    echo.
    echo :: If maintenance flag exists, skip restart
    echo if exist "%%MAINTENANCE_FLAG%%" (
    echo     echo [%%date%% %%time%%] Maintenance mode active — health-check skipped. ^^^>^^^> "%%LOG%%"
    echo     exit /b 0
    echo ^)
    echo.
    echo set BACKEND_OK=0
    echo set FRONTEND_OK=0
    echo.
    echo :: Check backend process status via PM2
    echo for /f "tokens=*" %%%%L in ('call "%%PM2_CMD%%" jlist 2^^^>nul') do set PM2_JSON=%%%%L
    echo.
    echo call "%%PM2_CMD%%" describe %%BACKEND_NAME%% 2^^^>nul ^| findstr /C:"status" ^| findstr /C:"online" ^^^>nul 2^^^>^^^&1
    echo if not errorlevel 1 set BACKEND_OK=1
    echo.
    echo call "%%PM2_CMD%%" describe %%FRONTEND_NAME%% 2^^^>nul ^| findstr /C:"status" ^| findstr /C:"online" ^^^>nul 2^^^>^^^&1
    echo if not errorlevel 1 set FRONTEND_OK=1
    echo.
    echo if "%%BACKEND_OK%%"=="1" if "%%FRONTEND_OK%%"=="1" (
    echo     echo [%%date%% %%time%%] Health OK — both apps online. ^^^>^^^> "%%LOG%%"
    echo     exit /b 0
    echo ^)
    echo.
    echo echo [%%date%% %%time%%] Health FAIL — Backend:%%BACKEND_OK%% Frontend:%%FRONTEND_OK%% — Restarting... ^^^>^^^> "%%LOG%%"
    echo cd /d "%PROJECT_PATH%\PM2-Setup"
    echo call "%%PM2_CMD%%" startOrReload "%%ECOSYSTEM%%" --update-env ^^^>^^^> "%%LOG%%" 2^^^>^^^>^^^&1
    echo call "%%PM2_CMD%%" save --force ^^^>^^^> "%%LOG%%" 2^^^>^^^>^^^&1
    echo echo [%%date%% %%time%%] Recovery attempt completed. ^^^>^^^> "%%LOG%%"
    echo exit /b 0
)

if not exist "%HEALTH_SCRIPT%" (
    echo [ERROR] Health-check script could not be written: %HEALTH_SCRIPT%
    pause & exit /b 1
)
echo [OK] Health-check script created: %HEALTH_SCRIPT%
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 10: Register Windows startup task (ONSTART, SYSTEM)
:: ──────────────────────────────────────────────────────────────

echo [STEP 10] Configuring Windows startup task...

schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "cmd.exe /d /c \"%BOOT_SCRIPT%\"" ^
    /sc ONSTART ^
    /delay %STARTUP_DELAY% ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Could not create startup task: %TASK_NAME%
    pause & exit /b 1
)

schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Startup task was created but cannot be verified.
    pause & exit /b 1
)
echo [OK] Startup task registered: %TASK_NAME%
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 11: Register health-check task (every 3 minutes)
:: ──────────────────────────────────────────────────────────────

echo [STEP 11] Configuring health-check task (every 3 minutes)...

schtasks /delete /tn "%HEALTH_TASK_NAME%" /f >nul 2>&1

schtasks /create ^
    /tn "%HEALTH_TASK_NAME%" ^
    /tr "cmd.exe /d /c \"%HEALTH_SCRIPT%\"" ^
    /sc MINUTE ^
    /mo 3 ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Could not create health-check task: %HEALTH_TASK_NAME%
    pause & exit /b 1
)

schtasks /query /tn "%HEALTH_TASK_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Health-check task was created but cannot be verified.
    pause & exit /b 1
)
echo [OK] Health-check task registered: %HEALTH_TASK_NAME% (every 3 min)
echo.

:: ──────────────────────────────────────────────────────────────
:: STEP 12: Show PM2 status
:: ──────────────────────────────────────────────────────────────

echo [STEP 12] Verifying PM2 status...
echo.
call "%PM2_CMD%" status
echo.

:: ──────────────────────────────────────────────────────────────
:: DONE
:: ──────────────────────────────────────────────────────────────

color 0A
echo.
echo  ====================================================================
echo    SETUP COMPLETED SUCCESSFULLY
echo  ====================================================================
echo.
echo  Apps are running under PM2:
echo    Backend  : http://localhost:%BACKEND_PORT%
echo    Frontend : http://localhost:%FRONTEND_PORT%
echo.
echo  Auto-start configured:
echo    Task: %TASK_NAME%  (runs on every Windows startup)
echo    Delay: %STARTUP_DELAY% after boot
echo.
echo  Health-check configured:
echo    Task: %HEALTH_TASK_NAME%  (runs every 3 minutes)
echo    To pause health-check during maintenance, run: stop-app.bat
echo.
echo  Logs location:
echo    App logs  : %LOG_DIR%
echo    Boot log  : %STARTUP_LOG%
echo    Health log: %HEALTH_LOG%
echo.
echo  Config file (change PROJECT_PATH here if you move the project):
echo    %SCRIPT_DIR%\config.bat
echo.
echo  Management commands:
echo    PM2-Setup\start-app.bat      Start both apps
echo    PM2-Setup\stop-app.bat       Stop both apps (sets maintenance flag)
echo    PM2-Setup\restart-app.bat    Restart both apps
echo    PM2-Setup\status-app.bat     Show current PM2 status
echo    PM2-Setup\health-check.bat   Manually run health check
echo.
echo  ====================================================================
echo.
pause
exit /b 0
