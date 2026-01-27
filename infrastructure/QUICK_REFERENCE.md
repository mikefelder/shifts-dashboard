# Infrastructure Quick Reference

## Quick Deploy Commands

### Option 1: Deploy Everything with PowerShell Script (Simplest)
```powershell
# Deploy to default resource group "ShiftboardReporting"
.\infrastructure\deploy.ps1

# Or specify custom app name
.\infrastructure\deploy.ps1 -AppServiceName "my-custom-name"

# Deploy with Key Vault (recommended for production)
.\infrastructure\deploy.ps1 -UseKeyVault
```

### Option 2: Deploy to Custom Resource Group
```powershell
.\infrastructure\deploy.ps1 `
  -ResourceGroupName "MyCustomRG" `
  -AppServiceName "hlsr-shiftboard-api" `
  -Location "eastus" `
  -Sku "B1" `
  -Environment "prod"
```

### Option 3: Manual Azure CLI Commands

```bash
# 1. Verify resource group exists (or create it)
az group show --name ShiftboardReporting
# If it doesn't exist:
# az group create --name ShiftboardReporting --location eastus

# 2. Deploy infrastructure
az deployment group create \
  --resource-group ShiftboardReporting \
  --template-file infrastructure/main.bicep \
  --parameters \
    appServiceName=hlsr-shiftboard-api \
    appServicePlanName=hlsr-shiftboard-plan \
    appServicePlanSku=B1 \
    shiftboardAccessKeyId="YOUR_KEY" \
    shiftboardSecretKey="YOUR_SECRET"

# 3. Deploy application
az webapp deployment source config-zip \
  --resource-group ShiftboardReporting \
  --name hlsr-shiftboard-api \
  --src azure-deployment-*.zip
```

## SKU Pricing Quick Reference

| SKU | Monthly Cost | vCPUs | RAM | Use Case |
|-----|--------------|-------|-----|----------|
| B1  | ~$13 | 1 | 1.75 GB | Dev/Test |
| B2  | ~$26 | 2 | 3.5 GB | Small apps |
| S1  | ~$70 | 1 | 1.75 GB | Production, auto-scale |
| S2  | ~$140 | 2 | 3.5 GB | Production, more traffic |
| P1v2 | ~$146 | 1 | 3.5 GB | High performance |

## Common Commands

### View Logs
```bash
az webapp log tail --name hlsr-shiftboard-api --resource-group ShiftboardReporting
```

### Restart App
```bash
az webapp restart --name hlsr-shiftboard-api --resource-group ShiftboardReporting
```

### Update Environment Variable
```bash
az webapp config appsettings set \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --settings NODE_ENV=production
```

### Scale Up/Down
```bash
# Scale to S1
az appservice plan update \
  --name hlsr-shiftboard-plan \
  --resource-group ShiftboardReporting \
  --sku S1
```

### View Application Insights
```bash
# Get instrumentation key
az monitor app-insights component show \
  --app hlsr-shiftboard-api-insights \
  --resource-group ShiftboardReporting \
  --query instrumentationKey
```

## File Structure

```
infrastructure/
├── main.bicep              # Main infrastructure template
├── keyvault.bicep          # Key Vault for secrets
├── main.parameters.json    # Parameter file
├── deploy.ps1              # PowerShell deployment script
└── README.md               # Detailed documentation
```

## What Gets Deployed

✅ **App Service Plan** (Linux, Node.js 18 LTS)
✅ **App Service** (with managed identity, HTTPS only)
✅ **Application Insights** (monitoring and logging)
✅ **Log Analytics Workspace** (centralized logs)
✅ **Key Vault** (optional, for secrets)

## Best Practices Checklist

- [x] HTTPS enforced
- [x] Managed identity enabled
- [x] Secrets in Key Vault
- [x] Application Insights enabled
- [x] Diagnostic logs enabled
- [x] Health checks configured
- [x] TLS 1.2 minimum
- [x] Auto-scaling capable (S1+)
- [x] Deployment slots (S1+)

## Troubleshooting

**Bicep validation error?**
```bash
az bicep build --file infrastructure/main.bicep
```

**Deployment stuck?**
```bash
az deployment group show \
  --name <deployment-name> \
  --resource-group ShiftboardReporting
```

**App not responding?**
```bash
az webapp log tail --name hlsr-shiftboard-api --resource-group ShiftboardReporting
```

## Clean Up

```bash
# Delete all resources in the resource group
az group delete --name ShiftboardReporting --yes --no-wait
```
