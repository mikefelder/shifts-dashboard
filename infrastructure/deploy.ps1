# Deploy to Azure - PowerShell Script
# This script automates the deployment of the HLSR Shiftboard API to Azure

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroupName = "ShiftboardReporting",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServiceName = "hlsr-shiftboard-api",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServicePlanName = "hlsr-shiftboard-plan",
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("B1", "B2", "S1", "S2", "P1v2", "P2v2")]
    [string]$AppServicePlanSku = "B1",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseKeyVault
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Azure Deployment Script" -ForegroundColor Cyan
Write-Host "HLSR Shiftboard Reporting API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
try {
    az --version | Out-Null
    Write-Host "Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "Azure CLI is not installed" -ForegroundColor Red
    Write-Host "Please install from: https://docs.microsoft.com/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Not logged in to Azure. Please login..." -ForegroundColor Yellow
    az login
}

$currentAccount = az account show | ConvertFrom-Json
Write-Host "Logged in as: $($currentAccount.user.name)" -ForegroundColor Green
Write-Host "  Subscription: $($currentAccount.name)" -ForegroundColor Cyan
Write-Host ""

# Confirm deployment
Write-Host "Deployment Configuration:" -ForegroundColor Yellow
Write-Host "  Resource Group: $ResourceGroupName" -ForegroundColor White
Write-Host "  App Service: $AppServiceName" -ForegroundColor White
Write-Host "  App Service Plan: $AppServicePlanName" -ForegroundColor White
Write-Host "  App Service Plan SKU: $AppServicePlanSku" -ForegroundColor White
Write-Host "  Location: $Location" -ForegroundColor White
Write-Host "  Environment: $Environment" -ForegroundColor White
Write-Host "  Use Key Vault: $UseKeyVault" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

# Check if resource group exists
Write-Host ""
Write-Host "Step 1: Verifying resource group..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq "false") {
    Write-Host "Resource group '$ResourceGroupName' does not exist. Creating it..." -ForegroundColor Yellow
    az group create --name $ResourceGroupName --location $Location
    Write-Host "Resource group created" -ForegroundColor Green
} else {
    Write-Host "Using existing resource group: $ResourceGroupName" -ForegroundColor Green
}

# Deploy Key Vault if requested
if ($UseKeyVault) {
    Write-Host ""
    Write-Host "Step 2: Deploying Key Vault..." -ForegroundColor Yellow
    $keyVaultName = "kv-$AppServiceName".Substring(0, [Math]::Min(24, "kv-$AppServiceName".Length))
    
    $objectId = az ad signed-in-user show --query id -o tsv
    
    az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file infrastructure/keyvault.bicep `
        --parameters `
            keyVaultName=$keyVaultName `
            adminObjectId=$objectId `
            environment=$Environment
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Key Vault deployed successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Please add your secrets to Key Vault:" -ForegroundColor Yellow
        Write-Host "  az keyvault secret set --vault-name $keyVaultName --name shiftboard-access-key-id --value YOUR_KEY" -ForegroundColor White
        Write-Host "  az keyvault secret set --vault-name $keyVaultName --name shiftboard-secret-key --value YOUR_SECRET" -ForegroundColor White
        Write-Host ""
        Read-Host "Press Enter after adding secrets to continue"
    } else {
        Write-Host "Key Vault deployment failed" -ForegroundColor Red
        exit 1
    }
}

# Deploy main infrastructure
Write-Host ""
Write-Host "Step 3: Deploying App Service infrastructure..." -ForegroundColor Yellow

if ($UseKeyVault) {
    # Use parameters file with Key Vault references
    Write-Host "Using Key Vault for secrets..." -ForegroundColor Cyan
    
    # Validate that placeholder values have been replaced
    $parametersContent = Get-Content -Path "infrastructure/main.parameters.json" -Raw
    if ($parametersContent -match '\{subscription-id\}' -or $parametersContent -match '\{keyvault-name\}') {
        Write-Host "ERROR: Parameter file contains placeholder values!" -ForegroundColor Red
        Write-Host "Please replace {subscription-id} and {keyvault-name} in infrastructure/main.parameters.json" -ForegroundColor Yellow
        Write-Host "You can use infrastructure/main.parameters.template.json as a reference." -ForegroundColor Yellow
        exit 1
    }
    
    az deployment group create `
        --resource-group $ResourceGroupName `
        --template-file infrastructure/main.bicep `
        --parameters infrastructure/main.parameters.json
} else {
    # Prompt for secrets (non-Key Vault flow)
    Write-Host "Please enter your Shiftboard credentials:" -ForegroundColor Yellow
    $accessKeyId = Read-Host "Shiftboard Access Key ID"
    $secretKey = Read-Host "Shiftboard Secret Key" -AsSecureString

    # Safely convert the SecureString to plain text only for JSON serialization
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey)
    try {
        $secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

        # Load base parameters file and inject runtime values, including secrets
        $baseParametersPath = "infrastructure/main.parameters.json"
        $parametersJson = Get-Content -Path $baseParametersPath -Raw | ConvertFrom-Json

        if (-not $parametersJson.parameters) {
            $parametersJson | Add-Member -MemberType NoteProperty -Name "parameters" -Value (@{})
        }

        $parameters = $parametersJson.parameters

        if (-not $parameters.appServiceName)       { $parameters.appServiceName       = @{ value = $AppServiceName } }       else { $parameters.appServiceName.value       = $AppServiceName }
        if (-not $parameters.appServicePlanName)   { $parameters.appServicePlanName   = @{ value = $AppServicePlanName } }   else { $parameters.appServicePlanName.value   = $AppServicePlanName }
        if (-not $parameters.location)            { $parameters.location            = @{ value = $Location } }             else { $parameters.location.value            = $Location }
        if (-not $parameters.environment)         { $parameters.environment         = @{ value = $Environment } }          else { $parameters.environment.value         = $Environment }
        if (-not $parameters.appServicePlanSku)   { $parameters.appServicePlanSku   = @{ value = $AppServicePlanSku } }    else { $parameters.appServicePlanSku.value   = $AppServicePlanSku }
        if (-not $parameters.shiftboardAccessKeyId) { $parameters.shiftboardAccessKeyId = @{ value = $accessKeyId } }      else { $parameters.shiftboardAccessKeyId.value = $accessKeyId }
        if (-not $parameters.shiftboardSecretKey) { $parameters.shiftboardSecretKey = @{ value = $secretKeyPlain } }       else { $parameters.shiftboardSecretKey.value = $secretKeyPlain }
        if (-not $parameters.enableApplicationInsights) { $parameters.enableApplicationInsights = @{ value = $true } }      else { $parameters.enableApplicationInsights.value = $true }

        # Write to a temporary parameters file to avoid putting secrets on the command line
        $tempParamFile = Join-Path -Path ([System.IO.Path]::GetTempPath()) -ChildPath ("main.parameters.{0}.json" -f ([guid]::NewGuid()))
        $parametersJson | ConvertTo-Json -Depth 10 | Set-Content -Path $tempParamFile -Encoding UTF8

        try {
            az deployment group create `
                --resource-group $ResourceGroupName `
                --template-file infrastructure/main.bicep `
                --parameters @"$tempParamFile"
        }
        finally {
            if (Test-Path -Path $tempParamFile) {
                Remove-Item -Path $tempParamFile -Force -ErrorAction SilentlyContinue
            }
        }
    }
    finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
        $secretKeyPlain = $null
    }
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Infrastructure deployed successfully" -ForegroundColor Green
} else {
    Write-Host "Infrastructure deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Quota exceeded: Try a different SKU (S1, P1v2) or request quota increase" -ForegroundColor White
    Write-Host "  - Resource name conflict: Change AppServiceName or AppServicePlanName" -ForegroundColor White
    Write-Host "  - Invalid credentials: Check your Shiftboard API keys" -ForegroundColor White
    Write-Host ""
    Write-Host "To use a different SKU, run:" -ForegroundColor Yellow
    Write-Host "  .\infrastructure\deploy.ps1 -AppServicePlanSku S1" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Deploy application
Write-Host ""
Write-Host "Step 4: Deploying application code..." -ForegroundColor Yellow
Write-Host "Looking for deployment ZIP file..." -ForegroundColor Cyan

$zipFile = Get-ChildItem -Path . -Filter "azure-deployment-*.zip" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($zipFile) {
    Write-Host "Found: $($zipFile.Name)" -ForegroundColor Green
    
    az webapp deployment source config-zip `
        --resource-group $ResourceGroupName `
        --name $AppServiceName `
        --src $zipFile.FullName
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Application deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "Application deployment failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No deployment ZIP file found" -ForegroundColor Red
    Write-Host "Please run: .\create-deployment-zip.ps1" -ForegroundColor Yellow
    exit 1
}

# Get deployment information
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

$appUrl = az webapp show --name $AppServiceName --resource-group $ResourceGroupName --query defaultHostName -o tsv
Write-Host ""
Write-Host "Application URL: https://$appUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit your application: https://$appUrl" -ForegroundColor White
$logsCommand = "az webapp log tail --name $AppServiceName --resource-group $ResourceGroupName"
Write-Host "2. View logs: $logsCommand" -ForegroundColor White
Write-Host "3. Monitor in Azure Portal at portal.azure.com" -ForegroundColor White
Write-Host ""
