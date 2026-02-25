# Deployment Guide: Shift Dashboard

**Version**: 1.0.0  
**Last Updated**: February 25, 2026  
**Target Platform**: Azure Container Apps

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Infrastructure Deployment](#initial-infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Configuration](#configuration)
6. [Seasonal Operations](#seasonal-operations)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Cost Management](#cost-management)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This document provides comprehensive deployment instructions for the Shift Dashboard application on Azure Container Apps. The architecture is designed for:

- **Cost-effective seasonal operations** with scale-to-zero capability
- **Multi-environment support** (dev, staging, production)
- **Automated CI/CD** via GitHub Actions
- **Zero-downtime deployments** with container revision management

### Architecture Components

- **Azure Container Registry (ACR)**: Stores Docker images
- **Azure Container Apps Environment**: Container orchestration platform
- **Container Apps**: Backend API (Node.js) and Frontend SPA (Nginx)
- **Log Analytics Workspace**: Centralized logging
- **Application Insights**: Telemetry and monitoring
- **Azure Key Vault**: Secrets management (Shiftboard credentials)

---

## Prerequisites

### Required Tools

1. **Azure CLI** (v2.45.0+)

   ```bash
   # Install Azure CLI
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

   # Or on macOS
   brew install azure-cli

   # Verify installation
   az version
   ```

2. **Docker** (v20.10+)

   ```bash
   # Verify Docker installation
   docker --version
   ```

3. **Git** (for GitHub Actions deployment)

   ```bash
   git --version
   ```

4. **jq** (JSON processor for script outputs)

   ```bash
   # On macOS
   brew install jq

   # On Ubuntu/Debian
   sudo apt-get install jq
   ```

### Azure Account Setup

1. **Azure Subscription**: Active subscription with Contributor role
2. **Resource Limits**: Ensure sufficient quota for:
   - Container Apps: 10 cores
   - Container Registry: Basic tier
   - Log Analytics: 5 GB/month

### Environment Variables

Create a `.env` file with Shiftboard credentials:

```bash
# Shiftboard API Configuration
SHIFTBOARD_ACCESS_KEY_ID=your-access-key-id
SHIFTBOARD_SECRET_KEY=your-secret-key
SHIFTBOARD_HOST=api.shiftboard.com
SHIFTBOARD_PATH=/api/v1/

# Azure Configuration (optional, defaults provided)
AZURE_RESOURCE_GROUP=shift-dashboard-rg
AZURE_LOCATION=eastus
```

---

## Initial Infrastructure Deployment

### Step 1: Validate Environment

```bash
# Run validation script
./scripts/validate-infrastructure.sh dev

# Expected output:
# ✓ Azure CLI installed and logged in
# ✓ Bicep template syntax is valid
# ✓ Subscription access confirmed
```

### Step 2: Deploy Infrastructure

```bash
# Deploy to development environment
./scripts/deploy-infrastructure.sh dev

# Deploy to production environment
./scripts/deploy-infrastructure.sh prod
```

**What gets deployed:**

- Resource Group: `shift-dashboard-rg`
- Container Registry: `shiftdashboard{uniqueId}`
- Container Apps Environment with Log Analytics
- Application Insights
- Key Vault (with managed identity access)
- Backend Container App (placeholder)
- Frontend Container App (placeholder)

**Deployment time**: ~5-10 minutes

### Step 3: Verify Deployment

```bash
# Check deployment status
az deployment group show \
  --resource-group shift-dashboard-rg \
  --name <deployment-name> \
  --query properties.provisioningState

# List deployed resources
az resource list \
  --resource-group shift-dashboard-rg \
  --output table
```

### Step 4: Save Deployment Outputs

The deployment script creates `.env.infrastructure` with outputs:

```bash
# Example .env.infrastructure
AZURE_CONTAINER_REGISTRY=shiftdashboardabc123.azurecr.io
BACKEND_URL=https://shift-dashboard-backend-dev.bluemeadow-12345678.eastus.azurecontainerapps.io
FRONTEND_URL=https://shift-dashboard-frontend-dev.bluemeadow-12345678.eastus.azurecontainerapps.io
APPINSIGHTS_CONNECTION_STRING=InstrumentationKey=...;IngestionEndpoint=...
```

---

## Application Deployment

### Option 1: Manual Deployment

#### Build Docker Images

```bash
# Build backend image
docker build -t shift-dashboard-backend:latest -f backend/Dockerfile .

# Build frontend image
docker build -t shift-dashboard-frontend:latest -f client/Dockerfile .
```

#### Push to Azure Container Registry

```bash
# Login to ACR
az acr login --name <registry-name>

# Tag images
docker tag shift-dashboard-backend:latest <registry-name>.azurecr.io/shift-dashboard-backend:latest
docker tag shift-dashboard-frontend:latest <registry-name>.azurecr.io/shift-dashboard-frontend:latest

# Push images
docker push <registry-name>.azurecr.io/shift-dashboard-backend:latest
docker push <registry-name>.azurecr.io/shift-dashboard-frontend:latest
```

#### Update Container Apps

```bash
# Update backend
az containerapp update \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg \
  --image <registry-name>.azurecr.io/shift-dashboard-backend:latest

# Update frontend
az containerapp update \
  --name shift-dashboard-frontend-dev \
  --resource-group shift-dashboard-rg \
  --image <registry-name>.azurecr.io/shift-dashboard-frontend:latest
```

### Option 2: GitHub Actions (Recommended)

#### Setup GitHub Secrets

Navigate to your repository → Settings → Secrets and add:

```yaml
AZURE_CREDENTIALS: { Azure service principal JSON }
AZURE_RESOURCE_GROUP: shift-dashboard-rg
AZURE_REGISTRY_NAME: shiftdashboardabc123
SHIFTBOARD_ACCESS_KEY_ID: your-key
SHIFTBOARD_SECRET_KEY: your-secret
```

#### Trigger Deployment

```bash
# On push to main (automatic)
git push origin main

# Or manually via GitHub UI
# Actions → Deploy → Run workflow
```

**Workflow steps:**

1. Build Docker images
2. Push to ACR
3. Update Container Apps with new images
4. Run smoke tests
5. Notify on success/failure

---

## Configuration

### Key Vault Secrets

Store sensitive configuration in Key Vault:

```bash
# Get Key Vault name
KEY_VAULT_NAME=$(az deployment group show \
  --resource-group shift-dashboard-rg \
  --name <deployment-name> \
  --query properties.outputs.keyVaultName.value -o tsv)

# Set Shiftboard credentials
az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name ShiftboardAccessKeyId \
  --value "your-access-key-id"

az keyvault secret set \
  --vault-name $KEY_VAULT_NAME \
  --name ShiftboardSecretKey \
  --value "your-secret-key"
```

### Environment Variables

Update Container App environment variables:

```bash
az containerapp env set \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg \
  --set-env-vars \
    "NODE_ENV=production" \
    "LOG_LEVEL=info" \
    "ALLOWED_ORIGINS=https://shift-dashboard-frontend-dev.azurecontainerapps.io"
```

### Custom Domain (Optional)

```bash
# Add custom domain
az containerapp hostname add \
  --resource-group shift-dashboard-rg \
  --name shift-dashboard-frontend-prod \
  --hostname dashboard.example.com

# Bind SSL certificate
az containerapp hostname bind \
  --resource-group shift-dashboard-rg \
  --name shift-dashboard-frontend-prod \
  --hostname dashboard.example.com \
  --certificate <certificate-id>
```

---

## Seasonal Operations

### Overview

The Shift Dashboard is designed for seasonal use (e.g., summer camp operations). Azure Container Apps provides **scale-to-zero** capability to minimize costs during off-season.

### Before Season Start (Spin-Up)

```bash
# 1. Verify infrastructure status
./scripts/validate-infrastructure.sh prod

# 2. Update application to latest version
git pull origin main
./scripts/deploy-apps.sh prod

# 3. Scale up to ensure availability
az containerapp update \
  --name shift-dashboard-backend-prod \
  --resource-group shift-dashboard-rg \
  --min-replicas 1 \
  --max-replicas 5

az containerapp update \
  --name shift-dashboard-frontend-prod \
  --resource-group shift-dashboard-rg \
  --min-replicas 1 \
  --max-replicas 3

# 4. Test all endpoints
curl https://backend.example.com/health
curl https://dashboard.example.com

# 5. Enable monitoring alerts
az monitor metrics alert create \
  --name "backend-high-errors" \
  --resource-group shift-dashboard-rg \
  --scopes <backend-app-id> \
  --condition "count Requests.Failed > 10" \
  --window-size 5m
```

### During Season (Active Operations)

**Daily Monitoring:**

- Check Application Insights dashboard
- Review error logs in Log Analytics
- Monitor cost trends in Azure Cost Management

**Weekly Tasks:**

- Review and rotate secrets (if needed)
- Update container images with patches
- Backup Key Vault configuration

### After Season End (Spin-Down)

```bash
# 1. Scale to zero to save costs
az containerapp update \
  --name shift-dashboard-backend-prod \
  --resource-group shift-dashboard-rg \
  --min-replicas 0 \
  --max-replicas 1

az containerapp update \
  --name shift-dashboard-frontend-prod \
  --resource-group shift-dashboard-rg \
  --min-replicas 0 \
  --max-replicas 1

# 2. Optionally stop Container Apps Environment
az containerapp env update \
  --name shift-dashboard-env-prod \
  --resource-group shift-dashboard-rg \
  --tags "status=dormant" "last-active=$(date +%Y-%m-%d)"

# 3. Disable monitoring alerts to avoid noise
az monitor metrics alert disable \
  --name "backend-high-errors" \
  --resource-group shift-dashboard-rg

# 4. (Optional) Export data for archival
# Run data export scripts if needed

# 5. Document downtime in README
echo "Last season: $(date +%Y)" >> SEASON_HISTORY.md
```

### Complete Teardown (Off-Season, Optional)

**⚠️ WARNING: This deletes all resources and data**

```bash
# Complete infrastructure teardown
./scripts/destroy-infrastructure.sh

# Type resource group name to confirm
# Type 'DELETE' to proceed
```

**Cost savings:**

- Scale-to-zero: ~$5-10/month (Log Analytics + Container Apps Environment)
- Complete teardown: $0/month (requires redeployment)

---

## Monitoring & Maintenance

### Application Insights Queries

Access Application Insights in Azure Portal or query via CLI:

```kusto
// Failed requests in last 24 hours
requests
| where timestamp > ago(24h)
| where success == false
| summarize count() by resultCode, operation_Name
| order by count_ desc

// Average response times
requests
| where timestamp > ago(1h)
| summarize avg(duration) by bin(timestamp, 5m), operation_Name
| render timechart

// Active users
pageViews
| where timestamp > ago(1h)
| summarize users = dcount(user_Id) by bin(timestamp, 5m)
| render timechart
```

### Log Analytics Queries

```kusto
// Container app logs
ContainerAppConsoleLogs_CL
| where ContainerAppName_s == "shift-dashboard-backend-prod"
| where TimeGenerated > ago(1h)
| project TimeGenerated, Log_s
| order by TimeGenerated desc

// Error logs only
ContainerAppConsoleLogs_CL
| where Log_s contains "ERROR" or Log_s contains "Error"
| project TimeGenerated, ContainerAppName_s, Log_s
```

### Health Checks

```bash
# Backend health
curl https://backend.example.com/health

# Frontend availability
curl -I https://dashboard.example.com

# Shiftboard connectivity
curl https://backend.example.com/api/system/echo -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

### Update Procedures

```bash
# Zero-downtime update
az containerapp revision copy \
  --name shift-dashboard-backend-prod \
  --resource-group shift-dashboard-rg \
  --image <new-image-tag>

# Monitor new revision
az containerapp revision list \
  --name shift-dashboard-backend-prod \
  --resource-group shift-dashboard-rg

# Rollback if needed
az containerapp revision activate \
  --name shift-dashboard-backend-prod \
  --resource-group shift-dashboard-rg \
  --revision <previous-revision-name>
```

---

## Cost Management

### Cost Breakdown (Estimated)

**Active Season (minReplicas=1):**

- Container Apps Environment: $10/month
- Log Analytics (5 GB): $15/month
- Application Insights: $5/month
- Container Registry (Basic): $5/month
- Container Apps (2 instances): $30/month
- Key Vault: $1/month
- **Total: ~$65-70/month**

**Off-Season (scale-to-zero):**

- Container Apps Environment: $10/month
- Log Analytics (minimal): $5/month
- Application Insights (disabled): $0/month
- Container Registry: $5/month
- Container Apps (zero replicas): $0/month
- Key Vault: $1/month
- **Total: ~$20-25/month**

### Cost Optimization Tips

1. **Use scale-to-zero during idle periods**

   ```bash
   az containerapp update --min-replicas 0
   ```

2. **Set appropriate log retention**

   ```bash
   az monitor log-analytics workspace update \
     --retention-time 30  # days
   ```

3. **Archive old container images**

   ```bash
   az acr repository delete --name <registry> --image old-image:tag
   ```

4. **Monitor cost alerts**
   ```bash
   az consumption budget create \
     --budget-name shift-dashboard-monthly \
     --amount 100 \
     --time-grain Monthly
   ```

---

## Troubleshooting

### Container App Won't Start

```bash
# Check logs
az containerapp logs show \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg \
  --tail 100

# Check environment variables
az containerapp env list \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg
```

### Shiftboard API Errors

```bash
# Test authentication
curl -X POST https://backend.example.com/api/system/echo \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Check Key Vault access
az keyvault secret show \
  --vault-name <vault-name> \
  --name ShiftboardAccessKeyId
```

### High Latency

```bash
# Check Shiftboard API response time
# Review Application Insights performance metrics

# Scale up container instances
az containerapp update \
  --name shift-dashboard-backend-prod \
  --cpu 1.0 \
  --memory 2Gi
```

### Deployment Failures

```bash
# View deployment logs
az deployment group show \
  --resource-group shift-dashboard-rg \
  --name <deployment-name> \
  --query properties.error

# Validate Bicep template
az bicep build --file infra/main.bicep

# Run what-if analysis
./scripts/validate-infrastructure.sh
```

---

## Additional Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/azure/container-apps/)
- [Application Insights Query Language](https://docs.microsoft.com/azure/azure-monitor/logs/query-language)
- [Shiftboard API Documentation](https://www.shiftboard.com/api-docs)
- [Project README](../README.md)
- [Architecture Diagrams](../specs/003-user-stories-implementation/plan.md)

---

## Support

For issues or questions:

1. Check Application Insights logs
2. Review GitHub Issues
3. Contact: [your-team@example.com]

**Last Updated**: February 21, 2026
