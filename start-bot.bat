@echo off
title InformalBot Manager
echo ========================================
echo           InformalBot Manager
echo ========================================
echo.
echo Starting bot with auto-restart capability...
echo Press Ctrl+C to stop the bot
echo.
echo ========================================

:start
echo [%date% %time%] Starting bot...
node bot-manager.js

echo.
echo [%date% %time%] Bot stopped or crashed
echo Restarting in 5 seconds...
timeout /t 5 /nobreak >nul
goto start
