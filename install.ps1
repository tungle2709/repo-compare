# Chocolatey Package Definition
$ErrorActionPreference = 'Stop'

$packageName = 'repodiffmatch'
$url = 'https://github.com/tungle2709/RepoDiffMatch/archive/main.zip'
$installDir = Join-Path $env:LOCALAPPDATA 'RepoDiffMatch'
$binDir = Join-Path $env:LOCALAPPDATA 'RepoDiffMatch\bin'

# Check if Node.js is installed
try {
    $nodeVersion = & node --version
    Write-Host "Node.js found: $nodeVersion"
} catch {
    throw "Node.js is required but not installed. Please install from https://nodejs.org/"
}

# Create directories
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
New-Item -ItemType Directory -Force -Path $binDir | Out-Null

# Download and extract
Write-Host "Downloading RepoDiffMatch..."
$zipPath = Join-Path $env:TEMP 'repodiffmatch.zip'
Invoke-WebRequest -Uri $url -OutFile $zipPath

Write-Host "Extracting..."
Expand-Archive -Path $zipPath -DestinationPath $env:TEMP -Force
Copy-Item -Path "$env:TEMP\RepoDiffMatch-main\*" -Destination $installDir -Recurse -Force

# Install dependencies
Set-Location $installDir
Write-Host "Installing dependencies..."
& npm install --production

# Create batch file
$batchContent = @"
@echo off
node "$installDir\index.js" %*
"@
$batchPath = Join-Path $binDir 'repodm.bat'
Set-Content -Path $batchPath -Value $batchContent

# Add to PATH
$userPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
if ($userPath -notlike "*$binDir*") {
    [Environment]::SetEnvironmentVariable('PATH', "$userPath;$binDir", 'User')
    Write-Host "Added to PATH: $binDir"
}

# Cleanup
Remove-Item $zipPath -Force
Remove-Item "$env:TEMP\RepoDiffMatch-main" -Recurse -Force

Write-Host "RepoDiffMatch installed successfully!"
Write-Host "Restart your terminal and use: repodm --version"
