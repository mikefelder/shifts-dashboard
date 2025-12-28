# 🚀 Quick Start Deployment

## Deploy in 3 Steps

### 1. Build the Application
```powershell
.\create-deployment-zip.ps1
```

### 2. Deploy to Azure
```powershell
.\infrastructure\deploy.ps1
```
That's it! The script will:
- Use existing resource group "ShiftboardReporting"
- Deploy App Service "hlsr-shiftboard-api"
- Prompt for Shiftboard credentials
- Deploy your application automatically

### 3. Access Your App
```
https://hlsr-shiftboard-api.azurewebsites.net
```

---

## Default Configuration

- **Resource Group**: `ShiftboardReporting` (existing)
- **App Service**: `hlsr-shiftboard-api`
- **Location**: `eastus`
- **SKU**: `B1` (~$13/month)
- **Runtime**: Node.js 18 LTS

## Customize Deployment

```powershell
# Change app name
.\infrastructure\deploy.ps1 -AppServiceName "my-custom-name"

# Change SKU
.\infrastructure\deploy.ps1 -Sku "S1"

# Use different resource group
.\infrastructure\deploy.ps1 -ResourceGroupName "MyCustomRG"

# Use Key Vault for secrets (production)
.\infrastructure\deploy.ps1 -UseKeyVault
```

## What Gets Deployed

✅ App Service (Node.js 18, HTTPS only)  
✅ App Service Plan (Linux)  
✅ Application Insights (monitoring)  
✅ Log Analytics (centralized logs)  
✅ Your React + Express application  

## Monitor Your App

### View Logs
```powershell
az webapp log tail --name hlsr-shiftboard-api --resource-group ShiftboardReporting
```

### Health Check
```
https://hlsr-shiftboard-api.azurewebsites.net/api/system/health
```

### Azure Portal
1. Go to https://portal.azure.com
2. Navigate to Resource Groups → ShiftboardReporting
3. Click on hlsr-shiftboard-api
4. View metrics, logs, and Application Insights

## Need Help?

- **Quick Reference**: `infrastructure/QUICK_REFERENCE.md`
- **Detailed Guide**: `infrastructure/README.md`
- **Architecture**: `infrastructure/OVERVIEW.md`

## Redeploy After Changes

```powershell
# 1. Rebuild application
.\create-deployment-zip.ps1

# 2. Deploy new version
az webapp deployment source config-zip `
  --resource-group ShiftboardReporting `
  --name hlsr-shiftboard-api `
  --src azure-deployment-*.zip
```

---

**That's it! Your app is live on Azure! 🎉**
