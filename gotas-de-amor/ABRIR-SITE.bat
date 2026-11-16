@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo O Node.js nao esta instalado neste computador.
  echo Vou abrir a pagina de download. Instale a versao LTS e clique neste arquivo de novo.
  start https://nodejs.org/
  pause
  exit /b 1
)
node scripts\iniciar.mjs
pause
