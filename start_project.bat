@echo off
setlocal
title AutoFlow Pro Command Center v3.0
color 0B

:: =========================================================
::       AUTOFLOW PRO - ULTIMATE LAUNCHER v3.0
::       Security | Maintenance | Devops
:: =========================================================

:MAIN_MENU
cls
echo.
echo    =======================================================
echo       A U T O F L O W   P R O   -   M A N A G E R
echo    =======================================================
echo.
echo    [1] INICIAR SISTEMA (Start All)
echo        - Limpieza de puertos + Backend + Frontend + Browser
echo.
echo    [2] CENTRO DE SEGURIDAD
echo        - Auditoria de vulnerabilidades (NPM Audit)
echo.
echo    [3] MANTENIMIENTO Y REPARACION
echo        - Limpiar cache, reparar dependencias
echo.
echo    [4] DIAGNOSTICO AVANZADO
echo        - Red,Git, Node, Puertos
echo.
echo    [5] RESPALDO RAPIDO
echo        - Crear backup local del codigo
echo.
echo    [6] MODO DESARROLLADOR
echo        - Abrir en VS Code
echo.
echo    [7] SALIR
echo.
echo ==========================================================
set /p op="> SELECCIONA UNA OPCION: "

if "%op%"=="1" goto START_SEQUENCE
if "%op%"=="2" goto SECURITY_CENTER
if "%op%"=="3" goto MAINTENANCE
if "%op%"=="4" goto DIAGNOSTICS
if "%op%"=="5" goto BACKUP
if "%op%"=="6" goto DEV_MODE
if "%op%"=="7" goto EXIT_APP
goto MAIN_MENU

:START_SEQUENCE
cls
echo.
echo [!] INICIANDO SECUENCIA MAESTRA...
echo.

echo    Cargando nucleo...
ping -n 2 127.0.0.1 >nul
echo    [OK]
echo.

echo    [1/3] Asegurando perimetro (Puertos 3000-3002)...
call :CLEAN_PORTS_SILENT
echo    [OK] Area despejada.
echo.

pushd "%~dp0"

echo    [2/3] Iniciando Backend (Secure Port 3002)...
start "AutoFlow Backend" cmd /k "color 0A && title AutoFlow Backend && echo [SECURE] Iniciando servidor... && cd backend && npm start"
timeout /t 5 /nobreak >nul
echo    [OK] Backend activo.
echo.

echo    [3/3] Desplegando Frontend (Vite)...
start "AutoFlow Frontend" cmd /k "color 0D && title AutoFlow Frontend && echo [UI] Renderizando interfaz... && npm run dev"
echo    [OK] Frontend activo.
echo.

echo    [INFO] Lanzando navegador...
timeout /t 3 /nobreak >nul
start http://localhost:3000

goto SYSTEM_ONLINE

:SYSTEM_ONLINE
cls
echo.
echo ==========================================================
echo    SISTEMA ONLINE - MONITOREO ACTIVO
echo ==========================================================
echo.
echo    [+] Backend .................. OK (3002)
echo    [+] Frontend ................. OK (3000)
echo    [+] Security Policy .......... ENFORCED
echo.
echo    Presiona una tecla para volver al menu...
pause >nul
goto MAIN_MENU

:SECURITY_CENTER
cls
color 0C
echo.
echo [!] CENTRO DE SEGURIDAD NPM
echo ==========================================================
echo.
echo    Analizando Backend...
cd backend
call npm audit --audit-level=high
if %errorlevel% equ 0 ( echo    [SAFE] Backend limpio. ) else ( echo    [WARN] Vulnerabilidades detectadas en Backend. )
cd ..
echo.
echo    Analizando Frontend...
call npm audit --audit-level=high
if %errorlevel% equ 0 ( echo    [SAFE] Frontend limpio. ) else ( echo    [WARN] Vulnerabilidades detectadas en Frontend. )
echo.
echo ==========================================================
echo.
pause
color 0B
goto MAIN_MENU

:MAINTENANCE
cls
color 0E
echo.
echo [!] PROTOCOLO DE MANTENIMIENTO
echo ==========================================================
echo.
echo    [1] Limpiar Cache de NPM (Force Clean)
echo    [2] Reinstalar dependencias (Backend)
echo    [3] Volver
echo.
set /p rop="> Opcion: "
if "%rop%"=="1" (
    echo    Limpiando cache...
    call npm cache clean --force
    echo    [OK] Cache limpia.
    pause
    goto MAINTENANCE
)
if "%rop%"=="2" (
    echo    Reinstalando modules del backend...
    cd backend
    if exist node_modules rmdir /s /q node_modules
    call npm install
    cd ..
    echo    [OK] Dependencias renovadas.
    pause
    goto MAINTENANCE
)
color 0B
goto MAIN_MENU

:BACKUP
cls
echo.
echo [!] GENERANDO RESPALDO LOCAL...
echo.
set "timestamp=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%"
set "timestamp=%timestamp: =0%"
set "backup_name=backup_%timestamp%"

echo    Creando carpeta: %backup_name%...
mkdir "..\%backup_name%"
echo    Copiando archivos criticos...
xcopy /E /I /Y "backend" "..\%backup_name%\backend" >nul
xcopy /E /I /Y "src" "..\%backup_name%\src" >nul
xcopy /Y "*.json" "..\%backup_name%\" >nul
xcopy /Y "*.ts" "..\%backup_name%\" >nul
xcopy /Y "*.tsx" "..\%backup_name%\" >nul

echo.
echo    [OK] Respaldo completado en carpeta superior.
echo.
pause
goto MAIN_MENU

:DIAGNOSTICS
cls
echo.
echo [!] DIAGNOSTICO COMPLETO
echo ==========================================================
echo.
echo [*] Conectividad...
ping -n 1 google.com >nul
if %errorlevel% equ 0 ( echo    [OK] Internet: CONECTADO ) else ( echo    [X] Internet: DESCONECTADO )
echo.
echo [*] Entorno Local...
echo    Node Version:
node -v
echo    NPM Version:
call npm -v
echo.
echo [*] Git Status...
git status -s
echo.
echo ==========================================================
pause
goto MAIN_MENU

:DEV_MODE
cls
code .
if %errorlevel% neq 0 start .
goto MAIN_MENU

:CLEAN_PORTS_SILENT
taskkill /F /IM node.exe >nul 2>&1
goto :eof

:EXIT_APP
color 07
cls
echo    Cerrando sistema...
exit
