$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$SiteDir = Join-Path $RepoRoot 'site'
$DeployDir = Join-Path $RepoRoot 'deploy'
$DirectusDataDir = Join-Path $DeployDir 'directus'
$DirectusDatabaseDir = Join-Path $DirectusDataDir 'database'
$DirectusUploadsDir = Join-Path $DirectusDataDir 'uploads'
$DirectusExtensionsDir = Join-Path $DirectusDataDir 'extensions'

$AstroPort = 4321
$DirectusPort = 8055
$SiteUrl = "http://localhost:$AstroPort"
$DirectusUrl = "http://localhost:$DirectusPort"
$DirectusLog = Join-Path $DirectusDataDir 'dev-directus.log'
$DirectusRunner = Join-Path $DirectusDataDir '.dev-directus-runner.ps1'

function Get-PortPids([int]$Port) {
  @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | Sort-Object -Unique)
}

function Get-ChildProcessIds([int]$ParentId) {
  $children = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$ParentId" -ErrorAction SilentlyContinue)

  foreach ($child in $children) {
    [int]$child.ProcessId
    Get-ChildProcessIds -ParentId ([int]$child.ProcessId)
  }
}

function Stop-ProcessTree([int]$ProcessId) {
  if ($ProcessId -eq $PID) { return }

  $targets = @(Get-ChildProcessIds -ParentId $ProcessId) + @($ProcessId)
  $targets = $targets | Sort-Object -Unique -Descending

  foreach ($targetId in $targets) {
    if ($targetId -eq $PID) { continue }

    try {
      Stop-Process -Id $targetId -Force -ErrorAction Stop
    } catch {
      # Processo já encerrou ou não pode ser acessado; manter a limpeza silenciosa.
    }
  }
}

function Clear-Port([int]$Port) {
  $processIds = @(Get-PortPids -Port $Port)

  foreach ($processId in $processIds) {
    Stop-ProcessTree -ProcessId $processId
  }
}

function Import-DotEnv([string]$Path) {
  if (-not (Test-Path $Path)) { return }

  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }

    $parts = $trimmed -split '=', 2
    if ($parts.Count -ne 2) { continue }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim()

    if (-not $name -or -not $value) { continue }

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
  }
}

function Get-EnvOrDefault([string[]]$Names, [string]$DefaultValue) {
  foreach ($name in $Names) {
    $value = [Environment]::GetEnvironmentVariable($name, 'Process')
    if ($value) { return $value }
  }

  $DefaultValue
}

function ConvertTo-PowerShellLiteral([string]$Value) {
  "'" + ($Value -replace "'", "''") + "'"
}

function Set-DirectusEnvironment {
  Import-DotEnv -Path (Join-Path $DeployDir '.env')

  $secret = Get-EnvOrDefault -Names @('SECRET', 'DIRECTUS_SECRET') -DefaultValue 'dev-local-secret-change-me-1234567890'
  $adminEmail = Get-EnvOrDefault -Names @('ADMIN_EMAIL', 'DIRECTUS_ADMIN_EMAIL') -DefaultValue 'admin@example.com'
  $adminPassword = Get-EnvOrDefault -Names @('ADMIN_PASSWORD', 'DIRECTUS_ADMIN_PASSWORD') -DefaultValue 'admin123456'
  $databaseFile = Join-Path $DirectusDatabaseDir 'data.db'

  $env:SECRET = $secret
  $env:DB_CLIENT = 'sqlite3'
  $env:DB_FILENAME = $databaseFile
  $env:ADMIN_EMAIL = $adminEmail
  $env:ADMIN_PASSWORD = $adminPassword
  $env:PUBLIC_URL = $DirectusUrl
  $env:PORT = [string]$DirectusPort
  $env:HOST = '0.0.0.0'
  $env:DEFAULT_LANGUAGE = 'pt-BR'
  $env:WEBSOCKETS_ENABLED = 'false'
  $env:TELEMETRY = 'false'
  $env:ASSETS_TRANSFORM_MAX_CONCURRENT = '4'
  $env:CORS_ENABLED = 'true'
  $env:CORS_ORIGIN = $SiteUrl
  $env:STORAGE_LOCATIONS = 'local'
  $env:STORAGE_LOCAL_DRIVER = 'local'
  $env:STORAGE_LOCAL_ROOT = $DirectusUploadsDir
  $env:EXTENSIONS_PATH = $DirectusExtensionsDir
}

function Write-DirectusRunner {
  $environmentLines = @(
    '$env:SECRET = ' + (ConvertTo-PowerShellLiteral $env:SECRET) + ';',
    '$env:DB_CLIENT = ' + (ConvertTo-PowerShellLiteral $env:DB_CLIENT) + ';',
    '$env:DB_FILENAME = ' + (ConvertTo-PowerShellLiteral $env:DB_FILENAME) + ';',
    '$env:ADMIN_EMAIL = ' + (ConvertTo-PowerShellLiteral $env:ADMIN_EMAIL) + ';',
    '$env:ADMIN_PASSWORD = ' + (ConvertTo-PowerShellLiteral $env:ADMIN_PASSWORD) + ';',
    '$env:PUBLIC_URL = ' + (ConvertTo-PowerShellLiteral $env:PUBLIC_URL) + ';',
    '$env:PORT = ' + (ConvertTo-PowerShellLiteral $env:PORT) + ';',
    '$env:HOST = ' + (ConvertTo-PowerShellLiteral $env:HOST) + ';',
    '$env:DEFAULT_LANGUAGE = ' + (ConvertTo-PowerShellLiteral $env:DEFAULT_LANGUAGE) + ';',
    '$env:WEBSOCKETS_ENABLED = ' + (ConvertTo-PowerShellLiteral $env:WEBSOCKETS_ENABLED) + ';',
    '$env:TELEMETRY = ' + (ConvertTo-PowerShellLiteral $env:TELEMETRY) + ';',
    '$env:ASSETS_TRANSFORM_MAX_CONCURRENT = ' + (ConvertTo-PowerShellLiteral $env:ASSETS_TRANSFORM_MAX_CONCURRENT) + ';',
    '$env:CORS_ENABLED = ' + (ConvertTo-PowerShellLiteral $env:CORS_ENABLED) + ';',
    '$env:CORS_ORIGIN = ' + (ConvertTo-PowerShellLiteral $env:CORS_ORIGIN) + ';',
    '$env:STORAGE_LOCATIONS = ' + (ConvertTo-PowerShellLiteral $env:STORAGE_LOCATIONS) + ';',
    '$env:STORAGE_LOCAL_DRIVER = ' + (ConvertTo-PowerShellLiteral $env:STORAGE_LOCAL_DRIVER) + ';',
    '$env:STORAGE_LOCAL_ROOT = ' + (ConvertTo-PowerShellLiteral $env:STORAGE_LOCAL_ROOT) + ';',
    '$env:EXTENSIONS_PATH = ' + (ConvertTo-PowerShellLiteral $env:EXTENSIONS_PATH) + ';'
  )
  $environmentBlock = [string]::Join([Environment]::NewLine, $environmentLines)

  $runner = @"
Set-Location $(ConvertTo-PowerShellLiteral $DeployDir)
$environmentBlock

npm run bootstrap
if (`$LASTEXITCODE -ne 0) { exit `$LASTEXITCODE }

npm run start
exit `$LASTEXITCODE
"@

  Set-Content -Path $DirectusRunner -Value $runner -Encoding UTF8
}

function Start-DirectusBackground {
  New-Item -ItemType Directory -Force -Path $DirectusDatabaseDir, $DirectusUploadsDir, $DirectusExtensionsDir | Out-Null
  Set-DirectusEnvironment
  Write-DirectusRunner

  if (Test-Path $DirectusLog) {
    Remove-Item $DirectusLog -Force -ErrorAction SilentlyContinue
  }

  $arguments = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    "& $(ConvertTo-PowerShellLiteral $DirectusRunner) *>> $(ConvertTo-PowerShellLiteral $DirectusLog)"
  )

  Start-Process -FilePath 'powershell.exe' -WorkingDirectory $DeployDir -ArgumentList $arguments | Out-Null
}

function Test-TcpPort([string]$HostName, [int]$Port, [int]$TimeoutMilliseconds = 1000) {
  $client = New-Object System.Net.Sockets.TcpClient

  try {
    $connection = $client.BeginConnect($HostName, $Port, $null, $null)
    if (-not $connection.AsyncWaitHandle.WaitOne($TimeoutMilliseconds, $false)) {
      return $false
    }

    $client.EndConnect($connection)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Wait-DirectusOnline {
  $timeoutSeconds = 300
  $retrySeconds = 2
  $deadline = (Get-Date).AddSeconds($timeoutSeconds)

  Write-Host "Aguardando o Directus ficar online na porta 8055 (Pode levar at$([char]0x00E9) 3 minutos no primeiro boot)..." -ForegroundColor Cyan

  while ((Get-Date) -lt $deadline) {
    if (Test-TcpPort -HostName '127.0.0.1' -Port $DirectusPort) {
      Write-Host "Directus online na porta $DirectusPort." -ForegroundColor Green
      return
    }

    Start-Sleep -Seconds $retrySeconds
  }

  throw "Timeout: Directus não respondeu na porta $DirectusPort em $timeoutSeconds segundos. Veja o log em $DirectusLog."
}

function Open-BrowserTabsSoon {
  $openCommand = "Start-Sleep -Seconds 5; Start-Process '$SiteUrl'; Start-Process '$DirectusUrl'"

  Start-Process -FilePath 'powershell.exe' -WindowStyle Hidden -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    $openCommand
  ) | Out-Null
}

function Stop-AstroDaemon {
  Push-Location $SiteDir
  try {
    npx astro dev stop *> $null
  } catch {
    # Daemon já parado ou indisponível; seguir silenciosamente.
  } finally {
    Pop-Location
  }
}

function Start-AstroForeground {
  if (-not (Test-Path (Join-Path $SiteDir 'package.json'))) {
    throw "package.json não encontrado em $SiteDir"
  }

  $env:DIRECTUS_URL = $DirectusUrl
  $env:PUBLIC_DIRECTUS_URL = $DirectusUrl
  $env:PUBLIC_SITE_URL = $SiteUrl

  Push-Location $SiteDir
  try {
    npx astro dev --port $AstroPort --host 0.0.0.0 --force
  } finally {
    Pop-Location
  }
}

Write-Host 'Limpando portas 4321 (Astro) e 8055 (Directus)...' -ForegroundColor Cyan
Clear-Port -Port $AstroPort
Clear-Port -Port $DirectusPort
Stop-AstroDaemon

Write-Host 'Iniciando Directus em segundo plano...' -ForegroundColor Cyan
Start-DirectusBackground

Wait-DirectusOnline

Write-Host 'Abrindo navegador em 5 segundos...' -ForegroundColor Cyan
Open-BrowserTabsSoon

Write-Host 'Iniciando Astro no terminal atual...' -ForegroundColor Cyan
Write-Host "Site:    $SiteUrl" -ForegroundColor Green
Write-Host "Directus: $DirectusUrl" -ForegroundColor Green
Write-Host "Log do Directus: $DirectusLog" -ForegroundColor DarkGray
Write-Host ''

Start-AstroForeground
