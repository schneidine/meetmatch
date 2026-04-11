@echo off
setlocal EnableExtensions

REM MeetMatch - start backend and mobile together on Windows
REM Usage: start.bat [ios^|android^|web]
REM Optional env: LAN_IP / EXPO_PUBLIC_LAN_IP, API_PORT / EXPO_PUBLIC_API_PORT

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"

set "VENV=%ROOT_DIR%\.venv"
set "BACKEND_DIR=%ROOT_DIR%\meetmatch_backend"
set "MOBILE_DIR=%ROOT_DIR%\frontend\meetmatch_mobile"
set "MODE=%~1"

if "%MODE%"=="" set "MODE=interactive"

if defined LAN_IP (
  set "HOST_IP=%LAN_IP%"
) else if defined EXPO_PUBLIC_LAN_IP (
  set "HOST_IP=%EXPO_PUBLIC_LAN_IP%"
) else (
  for /f "usebackq delims=" %%I in (`powershell -NoProfile -Command "$ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue ^| Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' } ^| Select-Object -First 1 -ExpandProperty IPAddress; if (-not $ip) { $ip = '127.0.0.1' }; Write-Output $ip"`) do set "HOST_IP=%%I"
)

if not defined HOST_IP set "HOST_IP=127.0.0.1"

if defined API_PORT (
  set "API_PORT_VALUE=%API_PORT%"
) else if defined EXPO_PUBLIC_API_PORT (
  set "API_PORT_VALUE=%EXPO_PUBLIC_API_PORT%"
) else (
  set "API_PORT_VALUE=8000"
)

if defined EXPO_PUBLIC_API_BASE_URL (
  set "API_BASE_URL=%EXPO_PUBLIC_API_BASE_URL%"
) else (
  set "API_BASE_URL=http://%HOST_IP%:%API_PORT_VALUE%"
)

set "FRONTEND_CMD="
if /I "%MODE%"=="ios" set "FRONTEND_CMD=npm run ios"
if /I "%MODE%"=="android" set "FRONTEND_CMD=npm run android"
if /I "%MODE%"=="web" set "FRONTEND_CMD=npm run web"
if /I "%MODE%"=="interactive" set "FRONTEND_CMD=npm start"
if /I "%MODE%"=="start" set "FRONTEND_CMD=npm start"

if /I "%MODE%"=="-h" goto :help
if /I "%MODE%"=="--help" goto :help
if not defined FRONTEND_CMD (
  echo Unknown mode: %MODE%
  echo Usage: start.bat [ios^|android^|web]
  exit /b 1
)

if not exist "%VENV%\Scripts\activate.bat" (
  echo ERROR: virtual environment not found at %VENV%
  echo Create one with: py -3 -m venv .venv ^&^& .venv\Scripts\activate ^&^& pip install -r meetmatch_backend\requirements.txt
  exit /b 1
)

echo ^> Installing backend dependencies...
call "%VENV%\Scripts\activate.bat"
python -m pip install -q -r "%BACKEND_DIR%\requirements.txt"
if errorlevel 1 exit /b 1

echo ^> Checking backend on %API_BASE_URL% ...
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %API_PORT_VALUE% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo ^> Starting Django backend on %API_BASE_URL% ...
  start "MeetMatch Backend" cmd /k "cd /d "%BACKEND_DIR%" ^&^& call "%VENV%\Scripts\activate.bat" ^&^& python manage.py runserver 0.0.0.0:%API_PORT_VALUE%"
) else (
  echo ^> Backend already running on %API_BASE_URL% - reusing existing server.
)

echo ^> Starting Expo mobile (API: %API_BASE_URL%) ...
echo ^> Mode: %MODE%
if /I "%MODE%"=="interactive" (
  echo ^> Expo input is enabled here: press i for iOS, a for Android, w for web.
)
if /I "%MODE%"=="start" (
  echo ^> Expo input is enabled here: press i for iOS, a for Android, w for web.
)

cd /d "%MOBILE_DIR%"
set "EXPO_PUBLIC_LAN_IP=%HOST_IP%"
set "EXPO_PUBLIC_API_PORT=%API_PORT_VALUE%"
set "EXPO_PUBLIC_API_BASE_URL=%API_BASE_URL%"
call %FRONTEND_CMD%
exit /b %ERRORLEVEL%

:help
echo Usage: start.bat [ios^|android^|web]
echo.
echo No argument starts Expo in interactive mode so you can press:
echo   i = open iOS simulator
echo   a = open Android emulator
echo   w = open web
echo.
echo Optional env overrides:
echo   set LAN_IP=192.168.x.x ^&^& set API_PORT=8000 ^&^& start.bat android
echo   set EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000 ^&^& start.bat
exit /b 0
