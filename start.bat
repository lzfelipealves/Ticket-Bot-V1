@echo off
title Discord Ticket Bot V1
cd %~dp0
:loop
echo ================================
echo Iniciando o Discord Ticket Bot V1...
echo ================================
REM Inicia o bot
node index.js
echo.
echo O bot foi fechado ou travou. Reiniciando em 5 segundos...
timeout /t 5
cls
goto loop
