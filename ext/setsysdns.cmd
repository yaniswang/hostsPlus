@echo off

if "%2"=="clear" goto :clear

netsh interface ip set dns name=%1 source=static addr=%2
ipconfig /flushdns
exit

:clear
netsh interface ip delete dns %1 all
ipconfig /flushdns