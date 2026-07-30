@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing packages...
  call npm.cmd install
  if errorlevel 1 goto :error
)
echo Starting development server...
call npm.cmd run dev
exit /b 0
:error
echo.
echo Failed to install packages. Check the error message above.
pause
exit /b 1
