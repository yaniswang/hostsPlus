@echo off

set netname=%1
set netname=%netname:_~= %

if "%2"=="clear" goto :clear

netsh interface ip set dns name="%netname%" source=static addr="%2"
ipconfig /flushdns
exit

:clear
netsh interface ip delete dns "%netname%" all
ipconfig /flushdns