$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Execute scripts/setup.ps1 primeiro.' }
& $python (Join-Path $PSScriptRoot 'bootstrap-admin.py')
if ($LASTEXITCODE -ne 0) { throw "Bootstrap administrativo falhou (exit $LASTEXITCODE)." }
