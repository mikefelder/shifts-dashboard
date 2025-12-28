# Azure Infrastructure Deployment Guide

## Overview

This directory contains Bicep templates to deploy the HLSR Shiftboard Reporting API to Azure App Service following best practices.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Azure Resource Group                │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Application Insights              │  │
│  │    (Monitoring & Logging)            │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    App Service Plan (Linux)          │  │
│  │    - SKU: B1/S1/P1v2                 │  │
│  │    - Node.js 18 LTS                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    App Service                       │  │
│  │    - HTTPS Only                      │  │
│  │    - Managed Identity Enabled        │  │
│  │    - Auto-scaling capable            │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Key Vault (Secrets)               │  │
│  │    - Shiftboard credentials          │  │
│  │    - Soft delete enabled             │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Log Analytics Workspace           │  │
│  │    (Centralized logging)             │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Prerequisites

1. **Azure CLI** installed and configured
   ```bash
   az --version
   az login
   ```

2. **Azure Subscription** with appropriate permissions

3. **Shiftboard API Credentials**
   - Access Key ID
   - Secret Key

## Deployment Steps

### Option 1: Quick Deployment using PowerShell (Easiest)

```powershell
# Simple deployment to existing "ShiftboardReporting" resource group
.\infrastructure\deploy.ps1

# The script will:
# - Use existing resource group "ShiftboardReporting" (or create it)
# - Deploy App Service with name "hlsr-shiftboard-api"
# - Prompt for Shiftboard credentials
# - Deploy the application ZIP automatically
```

### Option 2: Quick Deployment with Azure CLI

```bash
# 1. Set your subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# 2. Verify resource group exists (it should already exist)
az group show --name ShiftboardReporting

# 3. Deploy the infrastructure
az deployment group create \
  --resource-group ShiftboardReporting \
  --template-file infrastructure/main.bicep \
  --parameters \
    appServiceName=hlsr-shiftboard-api \
    appServicePlanName=hlsr-shiftboard-plan \
    appServicePlanSku=B1 \
    environment=prod \
    shiftboardAccessKeyId="YOUR_ACCESS_KEY_ID" \
    shiftboardSecretKey="YOUR_SECRET_KEY"
```

### Option 3: Secure Deployment with Key Vault (Recommended for Production)

#### Step 1: Deploy Key Vault First

```bash
# Verify resource group exists
az group show --name ShiftboardReporting

# Get your Azure AD object ID
$objectId = az ad signed-in-user show --query id -o tsv

# Deploy Key Vault
az deployment group create \
  --resource-group ShiftboardReporting \
  --template-file infrastructure/keyvault.bicep \
  --parameters \
    keyVaultName=kv-hlsr-shiftboard \
    adminObjectId=$objectId \
    environment=prod
```

#### Step 2: Add Secrets to Key Vault

```bash
# Add Shiftboard credentials
az keyvault secret set \
  --vault-name kv-hlsr-shiftboard \
  --name shiftboard-access-key-id \
  --value "YOUR_ACCESS_KEY_ID"

az keyvault secret set \
  --vault-name kv-hlsr-shiftboard \
  --name shiftboard-secret-key \
  --value "YOUR_SECRET_KEY"
```

#### Step 3: Update Parameters File

Edit `main.parameters.json` and replace placeholders:
- `{subscription-id}` with your subscription ID
- Resource group is already set to `ShiftboardReporting`
- `{keyvault-name}` with `kv-hlsr-shiftboard`

#### Step 4: Deploy Main Infrastructure

```bash
az deployment group create \
  --resource-group ShiftboardReporting \
  --template-file infrastructure/main.bicep \
  --parameters infrastructure/main.parameters.json
```

#### Step 5: Grant App Service Access to Key Vault

```bash
# Get the App Service principal ID
$principalId = az webapp identity show \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --query principalId -o tsv

# Grant access to Key Vault
az keyvault set-policy \
  --name kv-hlsr-shiftboard \
  --object-id $principalId \
  --secret-permissions get list
```

### Step 6: Deploy Application

```bash
# Use the deployment ZIP you created earlier
az webapp deployment source config-zip \
  --resource-group ShiftboardReporting \
  --name hlsr-shiftboard-api \
  --src azure-deployment-*.zip
```

## SKU Recommendations

### Development/Testing
- **B1 (Basic)**: $13/month
  - 1 core, 1.75 GB RAM
  - Good for development and testing
  - No auto-scaling
  - No deployment slots

### Production (Small)
- **S1 (Standard)**: $70/month
  - 1 core, 1.75 GB RAM
  - Auto-scaling up to 10 instances
  - Deployment slots (staging/production)
  - Custom domains & SSL

### Production (Medium)
- **S2 (Standard)**: $140/month
  - 2 cores, 3.5 GB RAM
  - Better for medium traffic
  - Auto-scaling capabilities

### Production (High Performance)
- **P1v2 (Premium v2)**: $146/month
  - 1 core, 3.5 GB RAM
  - Premium performance
  - Enhanced networking
  - Better for high-traffic scenarios

## Best Practices Implemented

### Security
✅ **HTTPS Only**: All traffic is forced to HTTPS
✅ **Managed Identity**: System-assigned identity for secure resource access
✅ **Key Vault Integration**: Secrets stored securely, never in code
✅ **TLS 1.2**: Minimum TLS version enforced
✅ **FTPS Only**: Secure FTP enabled only

### Performance
✅ **HTTP/2 Enabled**: Better performance for modern clients
✅ **Client Affinity Disabled**: Better load distribution
✅ **Always On**: Keeps app warm (S1 and above)
✅ **Health Checks**: Monitors application health

### Monitoring & Observability
✅ **Application Insights**: Full application monitoring
✅ **Log Analytics**: Centralized logging
✅ **Diagnostic Settings**: HTTP logs, console logs, app logs
✅ **Metrics**: Performance and resource metrics

### Reliability
✅ **Soft Delete**: Key Vault has 90-day soft delete
✅ **Purge Protection**: Prevents accidental permanent deletion
✅ **Health Check Path**: Automatic restart on unhealthy instances

### DevOps
✅ **SCM Build**: Automatic build during deployment
✅ **Node.js Version**: Pinned to LTS version
✅ **Infrastructure as Code**: All resources defined in Bicep

## Post-Deployment Configuration

### 1. Verify Deployment

```bash
# Get the app URL
az webapp show \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --query defaultHostName -o tsv
```

Visit `https://<app-name>.azurewebsites.net` to test

### 2. Configure Custom Domain (Optional)

```bash
# Map custom domain
az webapp config hostname add \
  --webapp-name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --hostname www.yourdomain.com

# Bind SSL certificate
az webapp config ssl upload \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --certificate-file path/to/cert.pfx \
  --certificate-password YOUR_PASSWORD
```

### 3. Enable Auto-scaling (S1 and above)

```bash
# Create autoscale rule based on CPU
az monitor autoscale create \
  --resource-group ShiftboardReporting \
  --resource hlsr-shiftboard-api \
  --resource-type Microsoft.Web/serverfarms \
  --name autoscale-cpu \
  --min-count 1 \
  --max-count 5 \
  --count 1

az monitor autoscale rule create \
  --resource-group ShiftboardReporting \
  --autoscale-name autoscale-cpu \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

### 4. Set Up Deployment Slots (S1 and above)

```bash
# Create staging slot
az webapp deployment slot create \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --slot staging

# Deploy to staging first, then swap
az webapp deployment source config-zip \
  --resource-group ShiftboardReporting \
  --name hlsr-shiftboard-api \
  --slot staging \
  --src azure-deployment-*.zip

# Swap staging to production
az webapp deployment slot swap \
  --resource-group ShiftboardReporting \
  --name hlsr-shiftboard-api \
  --slot staging
```

## Monitoring

### View Logs

```bash
# Stream live logs
az webapp log tail \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting

# Download logs
az webapp log download \
  --name hlsr-shiftboard-api \
  --resource-group ShiftboardReporting \
  --log-file logs.zip
```

### Application Insights

Access Application Insights in Azure Portal:
1. Navigate to your App Service
2. Click "Application Insights" in the left menu
3. View performance, failures, and usage metrics

## Cost Optimization

### For Development
- Use B1 SKU ($13/month)
- Disable Application Insights if not needed
- Use single instance (no scaling)

### For Production
- Start with S1 SKU ($70/month)
- Enable auto-scaling to scale down during low usage
- Set up alerts for cost thresholds:

```bash
az monitor metrics alert create \
  --name high-cost-alert \
  --resource-group ShiftboardReporting \
  --scopes /subscriptions/{sub-id}/resourceGroups/ShiftboardReporting \
  --condition "total cost > 100" \
  --description "Alert when monthly cost exceeds $100"
```

## Cleanup

To remove all resources:

```bash
az group delete \
  --name ShiftboardReporting \
  --yes \
  --no-wait
```

## Troubleshooting

### Deployment Fails
- Check Bicep syntax: `az bicep build --file infrastructure/main.bicep`
- Verify parameter values
- Check subscription permissions

### App Won't Start
- Check logs: `az webapp log tail`
- Verify environment variables are set
- Check Application Insights for errors

### Key Vault Access Denied
- Verify managed identity is enabled
- Check Key Vault access policies
- Ensure correct permissions granted

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/azure/app-service/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure Key Vault Best Practices](https://docs.microsoft.com/azure/key-vault/general/best-practices)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)

