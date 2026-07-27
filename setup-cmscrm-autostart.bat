@echo off
setlocal EnableExtensions EnableDelayedExpansion
title CMSCRM PM2 Auto-Start Setup

echo ==================================================
echo        CMSCRM PM2 AUTO-START CONFIGURATION
echo ==================================================
echo.

:: ==================================================
:: CONFIGURATION
:: ==================================================

set "APP_DIR=C:\Users\MES WM\Dashborad_server-main\CMSCRM"
set "ECOSYSTEM=%APP_DIR%\ecosystem.config.cjs"

set "USER_HOME=C:\Users\MES WM"
set "PM2_HOME=%USER_HOME%\.pm2"
set "PM2_CMD=%USER_HOME%\AppData\Roaming\npm\pm2.cmd"

set "STARTUP_DIR=C:\PM2Startup"
set "BOOT_SCRIPT=%STARTUP_DIR%\start-cmscrm.cmd"
set "LOG_FILE=%STARTUP_DIR%\pm2-startup.log"

set "TASK_NAME=CMSCRM-PM2-AutoStart"

:: ==================================================
:: CHECK ADMINISTRATOR RIGHTS
:: ==================================================

fltmc >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Administrator permission required.
    echo.
    echo Right-click this file and select:
    echo "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo [OK] Administrator permission confirmed.
echo.

:: ==================================================
:: VALIDATE PROJECT
:: ==================================================

if not exist "%APP_DIR%" (
    echo [ERROR] Project directory not found:
    echo %APP_DIR%
    echo.
    echo Check whether "Dashborad_server-main" folder name is correct.
    pause
    exit /b 1
)

if not exist "%ECOSYSTEM%" (
    echo [ERROR] ecosystem.config.cjs not found:
    echo %ECOSYSTEM%
    pause
    exit /b 1
)

echo [OK] CMSCRM project found.
echo.

:: ==================================================
:: CHECK NODE AND NPM
:: ==================================================

where node.exe >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not available in PATH.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1

if errorlevel 1 (
    echo [ERROR] npm is not installed or not available in PATH.
    pause
    exit /b 1
)

set "NODE_EXE="

for /f "delims=" %%I in ('where node.exe 2^>nul') do (
    if not defined NODE_EXE set "NODE_EXE=%%I"
)

for %%I in ("!NODE_EXE!") do set "NODE_DIR=%%~dpI"

echo [OK] Node.js found:
echo !NODE_EXE!
echo.

:: ==================================================
:: INSTALL PM2 ONLY WHEN MISSING
:: ==================================================

if not exist "%PM2_CMD%" (
    echo PM2 is not installed. Installing PM2 globally...
    echo.

    call npm install -g pm2

    if errorlevel 1 (
        echo [ERROR] PM2 installation failed.
        pause
        exit /b 1
    )
)

:: Try to locate PM2 if npm uses a different global directory.

if not exist "%PM2_CMD%" (
    set "FOUND_PM2="

    for /f "delims=" %%I in ('where pm2.cmd 2^>nul') do (
        if not defined FOUND_PM2 set "FOUND_PM2=%%I"
    )

    if defined FOUND_PM2 (
        set "PM2_CMD=!FOUND_PM2!"
    )
)

if not exist "%PM2_CMD%" (
    echo [ERROR] pm2.cmd could not be located.
    echo Run this command manually:
    echo npm install -g pm2
    pause
    exit /b 1
)

for %%I in ("%PM2_CMD%") do set "PM2_BIN=%%~dpI"

echo [OK] PM2 found:
echo %PM2_CMD%
echo.

:: ==================================================
:: SET COMMON PM2 HOME
:: ==================================================

if not exist "%PM2_HOME%" mkdir "%PM2_HOME%"

:: Makes manual PM2 commands and startup task use the same PM2 data.
setx PM2_HOME "%PM2_HOME%" /M >nul 2>&1

echo [OK] PM2_HOME configured:
echo %PM2_HOME%
echo.

:: ==================================================
:: START OR RELOAD CMSCRM
:: ==================================================

echo Starting CMSCRM through PM2...
echo.

pushd "%APP_DIR%"

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env

if not errorlevel 1 goto SAVE_PM2

:: ==================================================
:: SAFE PM2 REPAIR
:: Only runs when PM2 start fails.
:: Does not kill every node.exe process.
:: ==================================================

echo.
echo Initial PM2 start failed.
echo Attempting safe PM2 daemon repair...

call "%PM2_CMD%" kill >nul 2>&1

set "PM2_PID="

if exist "%PM2_HOME%\pm2.pid" (
    set /p PM2_PID=<"%PM2_HOME%\pm2.pid"
)

if defined PM2_PID (
    taskkill /F /PID !PM2_PID! >nul 2>&1
)

del /F /Q "%PM2_HOME%\rpc.sock" >nul 2>&1
del /F /Q "%PM2_HOME%\pub.sock" >nul 2>&1
del /F /Q "%PM2_HOME%\pm2.pid"  >nul 2>&1

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env

if errorlevel 1 goto PM2_START_ERROR

:SAVE_PM2

echo.
echo Saving PM2 process list...

call "%PM2_CMD%" save --force

if errorlevel 1 goto PM2_SAVE_ERROR

popd

echo [OK] CMSCRM started and PM2 process list saved.
echo.

goto CREATE_STARTUP_SCRIPT

:PM2_START_ERROR
popd
echo.
echo [ERROR] CMSCRM could not be started through PM2.
echo Check ecosystem.config.cjs and application logs.
pause
exit /b 1

:PM2_SAVE_ERROR
popd
echo.
echo [ERROR] PM2 process list could not be saved.
pause
exit /b 1

:: ==================================================
:: CREATE STARTUP SCRIPT
:: ==================================================

:CREATE_STARTUP_SCRIPT

if not exist "%STARTUP_DIR%" mkdir "%STARTUP_DIR%"

echo Creating reboot startup script...

> "%BOOT_SCRIPT%" (
    echo @echo off
    echo setlocal EnableExtensions
    echo.
    echo set "PM2_HOME=%PM2_HOME%"
    echo set "PATH=!NODE_DIR!;!PM2_BIN!;%%PATH%%"
    echo set "APP_DIR=%APP_DIR%"
    echo set "ECOSYSTEM=%ECOSYSTEM%"
    echo set "PM2_CMD=%PM2_CMD%"
    echo set "LOG_FILE=%LOG_FILE%"
    echo.
    echo echo ================================================== ^>^> "%%LOG_FILE%%"
    echo echo [%%date%% %%time%%] Starting CMSCRM after boot... ^>^> "%%LOG_FILE%%"
    echo.
    echo cd /d "%%APP_DIR%%"
    echo.
    echo call "%%PM2_CMD%%" startOrReload "%%ECOSYSTEM%%" --update-env ^>^> "%%LOG_FILE%%" 2^>^&1
    echo.
    echo if not errorlevel 1 goto SAVE_PROCESS_LIST
    echo.
    echo echo [%%date%% %%time%%] PM2 repair started. ^>^> "%%LOG_FILE%%"
    echo call "%%PM2_CMD%%" kill ^>^> "%%LOG_FILE%%" 2^>^&1
    echo del /F /Q "%%PM2_HOME%%\rpc.sock" ^>nul 2^>^&1
    echo del /F /Q "%%PM2_HOME%%\pub.sock" ^>nul 2^>^&1
    echo del /F /Q "%%PM2_HOME%%\pm2.pid" ^>nul 2^>^&1
    echo.
    echo call "%%PM2_CMD%%" startOrReload "%%ECOSYSTEM%%" --update-env ^>^> "%%LOG_FILE%%" 2^>^&1
    echo.
    echo if errorlevel 1 goto START_FAILED
    echo.
    echo :SAVE_PROCESS_LIST
    echo call "%%PM2_CMD%%" save --force ^>^> "%%LOG_FILE%%" 2^>^&1
    echo call "%%PM2_CMD%%" status ^>^> "%%LOG_FILE%%" 2^>^&1
    echo echo [%%date%% %%time%%] CMSCRM startup completed. ^>^> "%%LOG_FILE%%"
    echo exit /b 0
    echo.
    echo :START_FAILED
    echo echo [%%date%% %%time%%] ERROR: CMSCRM startup failed. ^>^> "%%LOG_FILE%%"
    echo exit /b 1
)

if errorlevel 1 (
    echo [ERROR] Startup script could not be created.
    pause
    exit /b 1
)

echo [OK] Startup script created:
echo %BOOT_SCRIPT%
echo.

:: ==================================================
:: CREATE WINDOWS STARTUP TASK
:: ==================================================

echo Creating Windows startup task...

schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "cmd.exe /d /c %BOOT_SCRIPT%" ^
    /sc ONSTART ^
    /delay 0000:30 ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Windows startup task could not be created.
    pause
    exit /b 1
)

echo [OK] Startup task created:
echo %TASK_NAME%
echo.

:: ==================================================
:: TEST TASK
:: ==================================================

echo Running startup task once for testing...

schtasks /run /tn "%TASK_NAME%" >nul 2>&1

if errorlevel 1 (
    echo [WARNING] Task was created but could not be started immediately.
    echo It may still run correctly after reboot.
) else (
    echo [OK] Startup task test initiated.
)

echo.
echo ==================================================
echo             CONFIGURATION COMPLETED
echo ==================================================
echo.
echo CMSCRM will automatically start:
echo   - When Windows starts
echo   - Even before user login
echo   - With a 30-second startup delay
echo   - Under the Windows SYSTEM account
echo.
echo Startup task:
echo   %TASK_NAME%
echo.
echo Startup log:
echo   %LOG_FILE%
echo.
echo PM2 data:
echo   %PM2_HOME%
echo.
echo IMPORTANT:
echo Close and reopen Command Prompt before running PM2 commands,
echo because PM2_HOME was added as a system environment variable.
echo.
pause
exit /b 0