@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title Bebras Process Judge - verify Supabase

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js LTS and try again.
  echo.
  pause
  exit /b 1
)

node "scripts\verify-supabase.mjs"
set "RESULT=%ERRORLEVEL%"

echo.
pause
exit /b %RESULT%
