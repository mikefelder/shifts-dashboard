# Azure Deployment Package Creation Script
# This script creates a ZIP file ready for Azure App Service deployment

Write-Host "Creating Azure deployment package..." -ForegroundColor Green

# Ensure we're in the project root
$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# Build the client if not already built
Write-Host ""
Write-Host "Step 1: Building client application..." -ForegroundColor Yellow
if (-not (Test-Path "client\dist")) {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Client already built (client\dist exists)" -ForegroundColor Cyan
    $rebuild = Read-Host "Rebuild client? (y/N)"
    if ($rebuild -eq 'y' -or $rebuild -eq 'Y') {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Build failed!" -ForegroundColor Red
            exit 1
        }
    }
}

# Validate client build output exists
$clientIndexPath = Join-Path "client\dist" "index.html"
if (-not (Test-Path $clientIndexPath)) {
    Write-Host "Client build output not found at $clientIndexPath. Aborting deployment package creation." -ForegroundColor Red
    exit 1
}

# Note: node_modules will be installed by Azure during deployment
Write-Host ""
Write-Host "Step 2: Skipping node_modules (will be installed on Azure)..." -ForegroundColor Yellow

# Create deployment package name with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$zipName = "azure-deployment-$timestamp.zip"
$zipPath = Join-Path $projectRoot $zipName

Write-Host ""
Write-Host "Step 3: Creating ZIP file..." -ForegroundColor Yellow

# Files and folders to include
$filesToInclude = @(
    "src",
    "client",
    "docs",
    "package.json",
    "LICENSE",
    "README.md"
)

# Create a temporary directory for staging
$tempDir = Join-Path $env:TEMP "azure-deploy-staging-$timestamp"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
    # Copy files to temp directory
    foreach ($item in $filesToInclude) {
        if (Test-Path $item) {
            Write-Host "  Including: $item" -ForegroundColor Cyan
            if (Test-Path $item -PathType Container) {
                Copy-Item -Path $item -Destination $tempDir -Recurse -Force
            } else {
                Copy-Item -Path $item -Destination $tempDir -Force
            }
        }
    }

    # Create the ZIP
    Write-Host ""
    Write-Host "Compressing files..." -ForegroundColor Yellow
    Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force

    # Clean up temp directory
    Remove-Item -Path $tempDir -Recurse -Force

    # Display results
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host ""
    Write-Host "SUCCESS! Deployment package created!" -ForegroundColor Green
    Write-Host "  File: $zipName" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "  Path: $zipPath" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Azure Portal (https://portal.azure.com)" -ForegroundColor White
    Write-Host "2. Navigate to your App Service" -ForegroundColor White
    Write-Host "3. Go to Deployment Center" -ForegroundColor White
    Write-Host "4. Upload $zipName" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use Azure CLI:" -ForegroundColor Yellow
    Write-Host "  az webapp deployment source config-zip --resource-group YOUR-RG --name YOUR-APP --src $zipName" -ForegroundColor White
    
    Write-Host ""
    Write-Host "IMPORTANT: Set environment variables in Azure Portal!" -ForegroundColor Red
    Write-Host "  - SHIFTBOARD_ACCESS_KEY_ID" -ForegroundColor White
    Write-Host "  - SHIFTBOARD_SECRET_KEY" -ForegroundColor White
    Write-Host "  - NODE_ENV=production" -ForegroundColor White
    Write-Host ""

} catch {
    $errorMsg = $_.Exception.Message
    Write-Host ""
    Write-Host "Error creating deployment package: $errorMsg" -ForegroundColor Red
    if (Test-Path $tempDir) {
        Remove-Item -Path $tempDir -Recurse -Force
    }
    exit 1
}
