param(
  [switch]$Limpar,
  [switch]$Dev,
  [switch]$LimparEDev
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$SiteDir = Join-Path $RepoRoot 'site'
$Porta = 4321
$Url = "http://localhost:$Porta"

function Write-Titulo($texto) {
  Write-Host ''
  Write-Host "=== $texto ===" -ForegroundColor Cyan
}

function Get-PortPids([int]$porta) {
  $linhas = netstat -ano -p TCP | Select-String ":$porta\s+.*LISTENING\s+(\d+)\s*$"
  $pids = @()
  foreach ($linha in $linhas) {
    $match = [regex]::Match($linha.Line, 'LISTENING\s+(\d+)\s*$')
    if ($match.Success) {
      $pids += [int]$match.Groups[1].Value
    }
  }
  $pids | Sort-Object -Unique
}

function Get-ChildProcessIds([int]$pid) {
  $filhos = @(Get-CimInstance Win32_Process -Filter "ParentProcessId=$pid" -ErrorAction SilentlyContinue)
  foreach ($filho in $filhos) {
    [int]$filho.ProcessId
    Get-ChildProcessIds -pid ([int]$filho.ProcessId)
  }
}

function Stop-ProcessTree([int]$pid) {
  if ($pid -eq $PID) { return }
  $todos = @(Get-ChildProcessIds -pid $pid) + @($pid)
  $todos = $todos | Sort-Object -Unique -Descending
  foreach ($alvo in $todos) {
    if ($alvo -eq $PID) { continue }
    try {
      $proc = Get-Process -Id $alvo -ErrorAction Stop
      Write-Host "Encerrando PID $alvo ($($proc.ProcessName))..." -ForegroundColor Yellow
      Stop-Process -Id $alvo -Force -ErrorAction Stop
    } catch {
      # Processo já encerrou.
    }
  }
}

function Get-DevServerPids {
  $pids = @()
  $pids += Get-PortPids -porta $Porta

  $siteRegex = [regex]::Escape($SiteDir)
  $processos = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
    $_.ProcessId -ne $PID -and
    $_.CommandLine -and
    $_.CommandLine -match $siteRegex -and
    ($_.CommandLine -match 'npm\s+run\s+dev' -or $_.CommandLine -match 'astro\s+dev')
  }

  foreach ($processo in $processos) {
    $pids += [int]$processo.ProcessId
  }

  $pids | Where-Object { $_ -and $_ -ne $PID } | Sort-Object -Unique
}

function Limpar-ServidoresConflito {
  Write-Titulo 'Limpando servidores npm/Astro em conflito'
  $pids = @(Get-DevServerPids)
  if ($pids.Count -eq 0) {
    Write-Host "Nenhum servidor em conflito encontrado na porta $Porta ou no projeto site." -ForegroundColor Green
    return
  }

  foreach ($pidAlvo in $pids) {
    Stop-ProcessTree -pid $pidAlvo
  }

  Start-Sleep -Seconds 1
  $restantes = @(Get-DevServerPids)
  if ($restantes.Count -eq 0) {
    Write-Host 'Limpeza concluída.' -ForegroundColor Green
  } else {
    Write-Host "Ainda existem PIDs em conflito: $($restantes -join ', ')" -ForegroundColor Red
  }
}

function Abrir-SiteDev {
  Write-Titulo 'Abrindo site em modo desenvolvimento'

  if (-not (Test-Path (Join-Path $SiteDir 'package.json'))) {
    throw "package.json não encontrado em $SiteDir"
  }

  if (-not (Test-Path (Join-Path $SiteDir 'node_modules'))) {
    Write-Host 'Dependências não encontradas. Rodando npm install...' -ForegroundColor Yellow
    Push-Location $SiteDir
    try {
      npm install
    } finally {
      Pop-Location
    }
  }

  Write-Host "Projeto: $SiteDir"
  Write-Host "URL:     $Url"
  Write-Host ''
  Write-Host 'O navegador será aberto automaticamente.' -ForegroundColor Green
  Write-Host 'Enquanto esta janela estiver aberta, o servidor dev fica ativo.' -ForegroundColor Green
  Write-Host 'Para encerrar, pressione Ctrl+C ou feche esta janela.' -ForegroundColor Yellow
  Write-Host ''

  Start-Process powershell.exe -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command',
    "Start-Sleep -Seconds 4; Start-Process '$Url'"
  ) | Out-Null

  Push-Location $SiteDir
  try {
    npm run dev -- --host 0.0.0.0 --port $Porta
  } finally {
    Pop-Location
    Limpar-ServidoresConflito
  }
}

function Mostrar-Menu {
  Clear-Host
  Write-Host 'Site STI Baixada Santista — desenvolvimento local' -ForegroundColor Cyan
  Write-Host ''
  Write-Host '1. Limpar servidores npm/Astro em conflito'
  Write-Host '2. Abrir o site em modo dev'
  Write-Host '3. Limpar conflitos e abrir o site em modo dev'
  Write-Host '0. Sair'
  Write-Host ''
}

try {
  if ($LimparEDev) {
    Limpar-ServidoresConflito
    Abrir-SiteDev
    exit 0
  }
  if ($Limpar) {
    Limpar-ServidoresConflito
    exit 0
  }
  if ($Dev) {
    Abrir-SiteDev
    exit 0
  }

  while ($true) {
    Mostrar-Menu
    $opcao = Read-Host 'Escolha uma opção'
    switch ($opcao) {
      '1' {
        Limpar-ServidoresConflito
        Read-Host 'Pressione Enter para voltar ao menu' | Out-Null
      }
      '2' {
        Abrir-SiteDev
        Read-Host 'Pressione Enter para voltar ao menu' | Out-Null
      }
      '3' {
        Limpar-ServidoresConflito
        Abrir-SiteDev
        Read-Host 'Pressione Enter para voltar ao menu' | Out-Null
      }
      '0' { break }
      default {
        Write-Host 'Opção inválida.' -ForegroundColor Red
        Start-Sleep -Seconds 1
      }
    }
  }
} catch {
  Write-Host ''
  Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
  Read-Host 'Pressione Enter para sair' | Out-Null
  exit 1
}
