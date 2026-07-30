@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Bebras Process Judge - Supabase setup

echo.
echo ============================================================
echo   Bebras Process Judge - Supabase setup
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 goto NO_NODE

if not exist "node_modules\vite" (
  echo Installing npm packages. This can take a few minutes...
  call npm install
  if errorlevel 1 goto INSTALL_FAILED
  echo.
)

node "scripts\setup-supabase.mjs"
if errorlevel 1 goto SETUP_FAILED

echo.
pause
exit /b 0

:NO_NODE
echo [ERROR] Node.js was not found.
echo Install Node.js LTS from https://nodejs.org and open a NEW terminal.
echo.
pause
exit /b 1

:INSTALL_FAILED
echo.
echo [ERROR] npm install failed. Check your network or proxy settings.
echo.
pause
exit /b 1

:SETUP_FAILED
echo.
echo Setup did not finish. Read the messages above, then run this file again.
echo Log file: supabase-setup.log
echo.
pause
exit /b 1
