@echo off

TITLE Slipyme API
ECHO -------------------------------
ECHO  Slipyme API Başlatılıyor
ECHO -------------------------------

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Yönetici izni gerekiyor. Yeniden başlatılıyor...
    powershell start -verb runas '%~dpnx0'
    exit /b
)

cd /d "%~dp0"

if exist .env (
  for /f "usebackq tokens=*" %%a in (.env) do set %%a
)

if not exist "src\cr\certificate.crt" (
  echo [HATA] Sertifika bulunamadı: src\cr\certificate.crt
  pause
  exit /b
)
if not exist "src\cr\private.key" (
  echo [HATA] Özel anahtar bulunamadı: src\cr\private.key
  pause
  exit /b
)

where node >nul 2>&1
if %errorLevel% neq 0 (
  echo [HATA] Node.js bulunamadı. Lütfen Node kurulu olsun.
  pause
  exit /b
)

where ts-node >nul 2>&1
if %errorLevel% neq 0 (
  echo [UYARI] ts-node bulunamadı, global kurulum yapılıyor...
  npm install -g ts-node typescript
)

if not exist "node_modules" (
  echo [INFO] node_modules klasörü bulunamadı. Yükleniyor...
  npm install
)

ECHO.
ECHO [INFO] API HTTPS başlatılıyor...
ECHO.

ts-node src/app.ts
pause
