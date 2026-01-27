# Azure Infrastructure Overview

## What Was Created

A complete Infrastructure as Code (IaC) solution for deploying the HLSR Shiftboard Reporting API to Azure App Service.

## Files Created

```
infrastructure/
├── main.bicep                    # Main infrastructure template (App Service, App Insights)
├── keyvault.bicep               # Key Vault for secure secret storage
├── main.parameters.json         # Parameter file for deployment
├── deploy.ps1                   # Automated PowerShell deployment script
├── README.md                    # Comprehensive deployment guide
└── QUICK_REFERENCE.md           # Quick command reference
```

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│         Resource Group                      │
│  ┌────────────────────────────────────┐    │
│  │  App Service Plan (Linux)          │    │
│  │  • Node.js 18 LTS                  │    │
│  │  • Configurable SKU (B1/S1/P1v2)   │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  App Service                       │    │
│  │  • Serves React + Express          │    │
│  │  • HTTPS Only                      │    │
│  │  • Managed Identity                │    │
│  │  • Health Checks                   │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Application Insights              │    │
│  │  • Performance monitoring          │    │
│  │  • Error tracking                  │    │
│  │  • Usage analytics                 │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Log Analytics Workspace           │    │
│  │  • Centralized logging             │    │
│  │  • 30-day retention                │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │  Key Vault (Optional)              │    │
│  │  • Shiftboard credentials          │    │
│  │  • Soft delete enabled             │    │
│  │  • Purge protection                │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

## Best Practices Implemented

### 🔒 Security
- **HTTPS Only**: All HTTP traffic redirected to HTTPS
- **TLS 1.2 Minimum**: Enforced minimum TLS version
- **Managed Identity**: System-assigned identity for secure resource access
- **Key Vault Integration**: Secrets never stored in code or configuration
- **FTPS Only**: Secure FTP for deployment
- **CORS Configuration**: Configurable allowed origins

### ⚡ Performance
- **HTTP/2 Enabled**: Modern protocol support
- **Client Affinity Disabled**: Better load distribution
- **Always On**: Prevents cold starts (S1+)
- **Health Check Path**: `/api/system/health` for monitoring
- **Auto-scaling Ready**: Configurable scaling rules (S1+)

### 📊 Monitoring & Observability
- **Application Insights**: Full APM solution
  - Request tracking
  - Dependency monitoring
  - Exception tracking
  - Custom metrics
- **Diagnostic Settings**: HTTP logs, console logs, app logs
- **Log Analytics**: Centralized log storage
- **Metrics**: CPU, memory, response time tracking
- **30-Day Log Retention**: Configurable retention period

### 🛡️ Reliability
- **Health Checks**: Automatic restart on failures
- **Soft Delete**: 90-day recovery window for Key Vault
- **Purge Protection**: Prevents accidental permanent deletion
- **Deployment Slots**: Blue-green deployments (S1+)
- **Auto-healing**: Configurable auto-healing rules

### 🚀 DevOps
- **Infrastructure as Code**: Everything defined in Bicep
- **Parameterized Deployments**: Reusable templates
- **Automated Deployment Script**: One-command deployment
- **SCM Build**: Automatic build during deployment
- **Version Pinning**: Node.js version specified

## SKU Recommendations

### Development (B1 - ~$13/month)
```bicep
appServicePlanSku: 'B1'
```
- 1 vCPU, 1.75 GB RAM
- ✅ Good for: Development, testing, demos
- ❌ No auto-scaling
- ❌ No deployment slots
- ❌ No Always On

### Small Production (S1 - ~$70/month)
```bicep
appServicePlanSku: 'S1'
```
- 1 vCPU, 1.75 GB RAM
- ✅ Auto-scaling (up to 10 instances)
- ✅ Deployment slots (staging/prod)
- ✅ Always On
- ✅ Custom domains & SSL
- ✅ Good for: Small to medium traffic

### Medium Production (S2 - ~$140/month)
```bicep
appServicePlanSku: 'S2'
```
- 2 vCPUs, 3.5 GB RAM
- ✅ All S1 features
- ✅ Better performance
- ✅ Good for: Medium to high traffic

### High Performance (P1v2 - ~$146/month)
```bicep
appServicePlanSku: 'P1v2'
```
- 1 vCPU, 3.5 GB RAM
- ✅ Premium performance tier
- ✅ Enhanced networking
- ✅ Good for: Production with SLA requirements

## Deployment Options

### Option 1: Quick Deploy (PowerShell Script)
```powershell
.\infrastructure\deploy.ps1 `
  -ResourceGroupName "ShiftboardReporting" `
  -AppServiceName "hlsr-shiftboard-api" `
  -Sku "B1"
```

### Option 2: Secure Deploy (with Key Vault)
```powershell
.\infrastructure\deploy.ps1 `
  -ResourceGroupName "ShiftboardReporting" `
  -AppServiceName "hlsr-shiftboard-api" `
  -UseKeyVault
```

### Option 3: Azure CLI
```bash
az deployment group create \
  --resource-group ShiftboardReporting \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/main.parameters.json
```

## Environment Variables Configured

The Bicep template automatically configures:

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production` | Bicep template |
| `WEBSITE_NODE_DEFAULT_VERSION` | `~18` | Bicep template |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` | Bicep template |
| `SHIFTBOARD_ACCESS_KEY_ID` | *(from parameters/Key Vault)* | Secure input |
| `SHIFTBOARD_SECRET_KEY` | *(from parameters/Key Vault)* | Secure input |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | *(auto-generated)* | Application Insights |

## Resources Created

When you deploy, Azure creates:

1. **App Service Plan** (`hlsr-shiftboard-plan`)
   - Linux-based hosting plan
   - Configurable SKU

2. **App Service** (`hlsr-shiftboard-api`)
   - Node.js 18 LTS runtime
   - System-assigned managed identity
   - Health check monitoring

3. **Application Insights** (`hlsr-shiftboard-api-insights`)
   - Application performance monitoring
   - Log analytics integration

4. **Log Analytics Workspace** (`hlsr-shiftboard-api-logs`)
   - Centralized log storage
   - 30-day retention

5. **Key Vault** (`kv-hlsr-shiftboard`) *(optional)*
   - Secure secret storage
   - Soft delete and purge protection

## Cost Estimation

### Minimal Setup (B1)
- App Service Plan B1: ~$13/month
- Application Insights: ~$2/month (first 5GB free)
- Log Analytics: ~$2/month (first 5GB free)
- **Total: ~$17/month**

### Production Setup (S1)
- App Service Plan S1: ~$70/month
- Application Insights: ~$5/month
- Log Analytics: ~$3/month
- Key Vault: ~$0.30/month
- **Total: ~$78/month**

### High Performance (P1v2)
- App Service Plan P1v2: ~$146/month
- Application Insights: ~$10/month
- Log Analytics: ~$5/month
- Key Vault: ~$0.30/month
- **Total: ~$161/month**

*Prices are estimates and may vary by region*

## Monitoring Endpoints

Once deployed, you can monitor:

- **Application URL**: `https://hlsr-shiftboard-api.azurewebsites.net`
- **Health Check**: `https://hlsr-shiftboard-api.azurewebsites.net/api/system/health`
- **Application Insights**: Azure Portal → Application Insights
- **Logs**: `az webapp log tail --name hlsr-shiftboard-api --resource-group ShiftboardReporting`

## Next Steps After Infrastructure Deployment

1. ✅ Create the deployment package: `.\create-deployment-zip.ps1`
2. ✅ Deploy infrastructure: `.\infrastructure\deploy.ps1`
3. ✅ Application is automatically deployed
4. ✅ Verify health: Visit `/api/system/health`
5. ✅ Monitor: Check Application Insights
6. ⏭️ Configure custom domain (optional)
7. ⏭️ Set up CI/CD pipeline (optional)
8. ⏭️ Configure auto-scaling rules (S1+)
9. ⏭️ Set up deployment slots (S1+)

## Support & Documentation

- **Quick Reference**: `infrastructure/QUICK_REFERENCE.md`
- **Detailed Guide**: `infrastructure/README.md`
- **Deployment Guide**: `AZURE_DEPLOYMENT.md`
- **Quick Deploy**: `DEPLOY_QUICK_GUIDE.md`

## Troubleshooting

Common issues and solutions are documented in:
- `infrastructure/README.md` (Troubleshooting section)
- Health check endpoint: `/api/system/health`
- Azure Portal logs and metrics


