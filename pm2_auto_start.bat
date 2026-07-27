@echo off
setlocal EnableExtensions DisableDelayedExpansion
title CMSCRM PM2 Auto-Start Setup

:: ==================================================
:: CMSCRM PM2 AUTO-START CONFIGURATION
:: Runs at Windows boot under SYSTEM, even without login
:: ==================================================

echo ==================================================
echo        CMSCRM PM2 AUTO-START CONFIGURATION
echo ==================================================
echo(

:: ==================================================
:: CONFIGURATION
:: ==================================================

set "APP_DIR=C:\Users\MES WM\Dashborad_server-main\CMSCRM"
set "ECOSYSTEM=%APP_DIR%\ecosystem.config.cjs"

set "USER_HOME=C:\Users\MES WM"
set "DEFAULT_PM2_CMD=%USER_HOME%\AppData\Roaming\npm\pm2.cmd"

:: A shared PM2 home is more reliable for a SYSTEM startup task.
set "SERVICE_DIR=C:\ProgramData\CMSCRM"
set "PM2_HOME=%SERVICE_DIR%\pm2"

set "STARTUP_DIR=C:\PM2Startup"
set "BOOT_SCRIPT=%STARTUP_DIR%\start-cmscrm.cmd"
set "LOG_FILE=%STARTUP_DIR%\pm2-startup.log"

set "TASK_NAME=CMSCRM-PM2-AutoStart"
set "STARTUP_DELAY=0001:00"

:: ==================================================
:: CHECK ADMINISTRATOR RIGHTS
:: ==================================================

fltmc >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Administrator permission is required.
    echo(
    echo Right-click this file and select "Run as administrator".
    echo(
    pause
    exit /b 1
)

echo [OK] Administrator permission confirmed.
echo(

:: ==================================================
:: VALIDATE PROJECT
:: ==================================================

if not exist "%APP_DIR%\" (
    echo [ERROR] Project directory not found:
    echo %APP_DIR%
    echo(
    echo Check whether the folder name "Dashborad_server-main" is correct.
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
echo(

:: ==================================================
:: CHECK NODE AND NPM
:: ==================================================

where node.exe >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or is not available in PATH.
    pause
    exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed or is not available in PATH.
    pause
    exit /b 1
)

set "NODE_EXE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"

if not defined NODE_EXE (
    echo [ERROR] node.exe could not be located.
    pause
    exit /b 1
)

for %%I in ("%NODE_EXE%") do set "NODE_DIR=%%~dpI"

echo [OK] Node.js found:
echo %NODE_EXE%
echo(

:: ==================================================
:: LOCATE OR INSTALL PM2
:: ==================================================

set "PM2_CMD=%DEFAULT_PM2_CMD%"

if not exist "%PM2_CMD%" (
    set "PM2_CMD="
    for /f "delims=" %%I in ('where pm2.cmd 2^>nul') do if not defined PM2_CMD set "PM2_CMD=%%I"
)

if not defined PM2_CMD (
    echo PM2 is not installed. Installing PM2 globally...
    echo(

    call npm.cmd install -g pm2
    if errorlevel 1 (
        echo [ERROR] PM2 installation failed.
        pause
        exit /b 1
    )

    set "PM2_CMD=%DEFAULT_PM2_CMD%"
)

if not exist "%PM2_CMD%" (
    set "PM2_CMD="
    for /f "delims=" %%I in ('where pm2.cmd 2^>nul') do if not defined PM2_CMD set "PM2_CMD=%%I"
)

if not defined PM2_CMD (
    echo [ERROR] pm2.cmd could not be located.
    echo Run this command manually:
    echo npm install -g pm2
    pause
    exit /b 1
)

if not exist "%PM2_CMD%" (
    echo [ERROR] PM2 command does not exist:
    echo %PM2_CMD%
    pause
    exit /b 1
)

for %%I in ("%PM2_CMD%") do set "PM2_BIN=%%~dpI"

echo [OK] PM2 found:
echo %PM2_CMD%
echo(

:: ==================================================
:: PREPARE SHARED DIRECTORIES AND PM2 HOME
:: ==================================================

if not exist "%SERVICE_DIR%\" mkdir "%SERVICE_DIR%" >nul 2>&1
if not exist "%PM2_HOME%\" mkdir "%PM2_HOME%" >nul 2>&1
if not exist "%STARTUP_DIR%\" mkdir "%STARTUP_DIR%" >nul 2>&1

if not exist "%PM2_HOME%\" (
    echo [ERROR] Shared PM2 directory could not be created:
    echo %PM2_HOME%
    pause
    exit /b 1
)

if not exist "%STARTUP_DIR%\" (
    echo [ERROR] Startup directory could not be created:
    echo %STARTUP_DIR%
    pause
    exit /b 1
)

:: Use the same PM2 data location for setup, manual commands and startup task.
set "PM2_HOME=%PM2_HOME%"
setx PM2_HOME "%PM2_HOME%" /M >nul 2>&1

echo [OK] Shared PM2_HOME configured:
echo %PM2_HOME%
echo(

:: ==================================================
:: START OR RELOAD CMSCRM NOW
:: ==================================================

echo Starting CMSCRM through PM2...
echo(

pushd "%APP_DIR%"
if errorlevel 1 (
    echo [ERROR] Could not open the project directory.
    pause
    exit /b 1
)

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env
if not errorlevel 1 goto SAVE_PM2

echo(
echo Initial PM2 start failed.
echo Attempting a safe PM2 daemon repair...

call "%PM2_CMD%" kill >nul 2>&1

del /F /Q "%PM2_HOME%\rpc.sock" >nul 2>&1
del /F /Q "%PM2_HOME%\pub.sock" >nul 2>&1
del /F /Q "%PM2_HOME%\pm2.pid"  >nul 2>&1

timeout /t 3 /nobreak >nul

call "%PM2_CMD%" startOrReload "%ECOSYSTEM%" --update-env
if errorlevel 1 goto PM2_START_ERROR

:SAVE_PM2
echo(
echo Saving PM2 process list...

call "%PM2_CMD%" save --force
if errorlevel 1 goto PM2_SAVE_ERROR

call "%PM2_CMD%" status

popd

echo [OK] CMSCRM started and PM2 process list saved.
echo(
goto CREATE_STARTUP_SCRIPT

:PM2_START_ERROR
popd
echo(
echo [ERROR] CMSCRM could not be started through PM2.
echo Check ecosystem.config.cjs and application logs.
pause
exit /b 1

:PM2_SAVE_ERROR
popd
echo(
echo [ERROR] PM2 process list could not be saved.
pause
exit /b 1

:: ==================================================
:: CREATE BOOT SCRIPT
:: ==================================================

:CREATE_STARTUP_SCRIPT

echo Creating reboot startup script...

(
    echo @echo off
    echo setlocal EnableExtensions EnableDelayedExpansion
    echo set "PM2_HOME=%PM2_HOME%"
    echo set "PATH=%NODE_DIR%;%PM2_BIN%;%%PATH%%"
    echo set "APP_DIR=%APP_DIR%"
    echo set "ECOSYSTEM=%ECOSYSTEM%"
    echo set "PM2_CMD=%PM2_CMD%"
    echo set "LOG_FILE=%LOG_FILE%"
    echo set /a ATTEMPT=0
    echo if not exist "%%PM2_HOME%%\" mkdir "%%PM2_HOME%%" ^>nul 2^>^&1
    echo if not exist "%%APP_DIR%%\" goto APP_DIR_NOT_FOUND
    echo if not exist "%%ECOSYSTEM%%" goto ECOSYSTEM_NOT_FOUND
    echo echo ================================================== ^>^> "%%LOG_FILE%%"
    echo echo [%%date%% %%time%%] CMSCRM boot startup initiated. ^>^> "%%LOG_FILE%%"
    echo cd /d "%%APP_DIR%%"
    echo if errorlevel 1 goto APP_DIR_NOT_FOUND
    echo :START_RETRY
    echo set /a ATTEMPT+=1
    echo echo [%%date%% %%time%%] PM2 startup attempt !ATTEMPT!. ^>^> "%%LOG_FILE%%"
    echo call "%%PM2_CMD%%" startOrReload "%%ECOSYSTEM%%" --update-env ^>^> "%%LOG_FILE%%" 2^>^&1
    echo if not errorlevel 1 goto START_SUCCESS
    echo if !ATTEMPT! GEQ 3 goto START_FAILED
    echo echo [%%date%% %%time%%] Waiting before retry. ^>^> "%%LOG_FILE%%"
    echo timeout /t 15 /nobreak ^>nul
    echo goto START_RETRY
    echo :START_SUCCESS
    echo call "%%PM2_CMD%%" save --force ^>^> "%%LOG_FILE%%" 2^>^&1
    echo call "%%PM2_CMD%%" status ^>^> "%%LOG_FILE%%" 2^>^&1
    echo echo [%%date%% %%time%%] CMSCRM startup completed successfully. ^>^> "%%LOG_FILE%%"
    echo exit /b 0
    echo :APP_DIR_NOT_FOUND
    echo echo [%%date%% %%time%%] ERROR: Application directory not found: %%APP_DIR%% ^>^> "%%LOG_FILE%%"
    echo exit /b 2
    echo :ECOSYSTEM_NOT_FOUND
    echo echo [%%date%% %%time%%] ERROR: Ecosystem file not found: %%ECOSYSTEM%% ^>^> "%%LOG_FILE%%"
    echo exit /b 3
    echo :START_FAILED
    echo echo [%%date%% %%time%%] ERROR: CMSCRM startup failed after !ATTEMPT! attempts. ^>^> "%%LOG_FILE%%"
    echo call "%%PM2_CMD%%" status ^>^> "%%LOG_FILE%%" 2^>^&1
    echo exit /b 1
) > "%BOOT_SCRIPT%"

if errorlevel 1 (
    echo [ERROR] Startup script could not be created.
    pause
    exit /b 1
)

if not exist "%BOOT_SCRIPT%" (
    echo [ERROR] Startup script was not found after creation:
    echo %BOOT_SCRIPT%
    pause
    exit /b 1
)

echo [OK] Startup script created:
echo %BOOT_SCRIPT%
echo(

:: ==================================================
:: CREATE WINDOWS STARTUP TASK
:: ==================================================

echo Creating Windows startup task...

schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

schtasks /create ^
    /tn "%TASK_NAME%" ^
    /tr "cmd.exe /d /c %BOOT_SCRIPT%" ^
    /sc ONSTART ^
    /delay %STARTUP_DELAY% ^
    /ru SYSTEM ^
    /rl HIGHEST ^
    /f

if errorlevel 1 (
    echo(
    echo [ERROR] Windows startup task could not be created.
    pause
    exit /b 1
)

schtasks /query /tn "%TASK_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Startup task was created but could not be verified.
    pause
    exit /b 1
)

echo(
echo [OK] Startup task created and verified:
echo %TASK_NAME%
echo(

:: ==================================================
:: TEST STARTUP TASK
:: ==================================================

echo Running startup task once for testing...

schtasks /run /tn "%TASK_NAME%" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Task was created but could not be started immediately.
    echo It should still run automatically after the next reboot.
) else (
    echo [OK] Startup task test initiated.
    timeout /t 10 /nobreak >nul
)

echo(
echo ==================================================
echo             CONFIGURATION COMPLETED
echo ==================================================
echo(
echo CMSCRM will automatically start:
echo   - When Windows starts
echo   - Even when no user has logged in
echo   - Under the Windows SYSTEM account
echo   - After a 1-minute startup delay
echo(
echo Startup task:
echo   %TASK_NAME%
echo(
echo Startup script:
echo   %BOOT_SCRIPT%
echo(
echo Startup log:
echo   %LOG_FILE%
echo(
echo Shared PM2 data:
echo   %PM2_HOME%
echo(
echo Verification command:
echo   schtasks /query /tn "%TASK_NAME%" /v /fo list
echo(
echo Log command:
echo   type "%LOG_FILE%"
echo(
echo IMPORTANT:
echo Restart Windows and leave it at the login screen to test startup without login.
echo The CMSCRM URL or API should become available automatically.
echo(
pause
exit /b 0
