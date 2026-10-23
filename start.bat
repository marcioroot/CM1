@echo off
title CM1 Dictation App Server
echo Starting CM1 Dictation App Server...
cd /d "%~dp0"

:: Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found in your system PATH.
    echo Please ensure Node.js is installed from https://nodejs.org/
    pause
    exit /b 1
)

:: Open the application in the default web browser
start http://localhost:3000/

:: Start the local web server
node serve.js

:: Keep window open if the server stops or crashes
pause
