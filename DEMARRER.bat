@echo off
REM ============================================================
REM  DEV LOCAL UNIQUEMENT — votre client n'a pas besoin de ca.
REM  En production : https://votre-domaine.com/admin.html
REM ============================================================
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1"
pause
