# Azure Infrastructure

This directory contains Infrastructure as Code (IaC) for the Shift Dashboard application using Azure Bicep.

## Architecture

The infrastructure deploys a complete Azure Container Apps environment with:

```
┌─────────────────────────────────────────────────────────────┐
│ Resource Group (shifts-dashboard-rg)                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Container Registry (ACR)                             │  │
│  │ - Stores Docker images for backend and frontend     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Log Analytics Workspace                              │  │
│  │ - Centralized logging for all apps                  │  │
│  │ - 30-day retention                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Container Apps Environment                           │  │
│  │ ┌─────────────────────┐  ┌────────────────────────┐ │  │
│  │ │ Backend Container   │  │ Frontend Container    │ │  │
│  │ │ - Node.js API       │  │ - React SPA (Nginx)   │ │  │
│  │ │ - Port 3000         │  │ - Port 80            │ │  │
│  │ │ - 0.5 CPU / 1Gi    │  │ - 0.25 CPU / 0.5Gi   │ │  │
│  │ │ - Scale: 0-3       │  │ - Scale: 0-3         │ │  │
│  │ └─────────────────────┘  └────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
infra/
├── main.bicep                         # Main orchestration template
├── main.json                          # Generated ARM template (gitignored)
└── modules/
    ├── container-registry.bicep       # Azure Container Registry
    ├── container-apps-env.bicep       # Container Apps Environment + Log Analytics
    └── container-app.bicep            # Generic Container App template
```

## Prerequisites

- **Azure CLI**: Version 2.50.0 or higher

  ```bash
  az --version
  ```

- **Bicep CLI**: Included with Azure CLI

  ```bash
  az bicep version
  ```

- **Azure Subscription**: Active subscription with Contributor role
  ```bash
  az account show
  ```

## Quick Start

### 1. Login to Azure

```bash
az login
az account set --subscription "<your-subscription-id>"
```

### 2. Set Environment Variables (Optional)

```bash
export AZURE_RESOURCE_GROUP="shifts-dashboard-rg"
export AZURE_LOCATION="eastus"
```

### 3. Deploy Infrastructure

```bash
./scripts/deploy-infrastructure.sh dev
```

Or manually:

```bash
# Create resource group
az group create --name shifts-dashboard-rg --location eastus

# Validate Bicep
az bicep build --file infra/main.bicep

# Preview changes
az deployment group what-if \
  --resource-group shifts-dashboard-rg \
  --template-file infra/main.bicep \
  --parameters environment=dev

# Deploy
az deployment group create \
  --resource-group shifts-dashboard-rg \
  --template-file infra/main.bicep \
  --parameters environment=dev
```

## Modules

### `main.bicep`

Main orchestration template that combines all modules:

- **Parameters**: `location`, `environment` (dev/staging/prod), `appName`
- **Resources**: Calls all module templates
- **Outputs**: Registry login server, app URLs

### `modules/container-registry.bicep`

Azure Container Registry for storing Docker images:

- **SKU**: Basic (sufficient for dev, upgrade to Standard/Premium for prod)
- **Admin user**: Enabled for simplified authentication
- **Network**: Public access (for development)

### `modules/container-apps-env.bicep`

Container Apps Environment with Log Analytics:

- **Log Analytics**: 30-day retention, PerGB2018 pricing tier
- **Environment**: Non-zone-redundant (upgrade for production)
- **Logs**: Integrated with Log Analytics workspace

### `modules/container-app.bicep`

Reusable template for deploying Container Apps:

- **Scaling**: Auto-scale from 0-3 replicas (scale-to-zero enabled)
- **Ingress**: External HTTPS with auto SSL/TLS
- **Resources**: Configurable CPU and memory
- **Secrets**: Registry credentials stored securely
- **Environment**: Support for environment variables

## Environments

### Development (`dev`)

- **Scale**: 0-3 replicas
- **SKU**: Basic Container Registry
- **Zone Redundancy**: Disabled
- **Purpose**: Development and testing

### Staging (`staging`)

- **Scale**: 0-5 replicas
- **SKU**: Standard Container Registry (recommended)
- **Purpose**: Pre-production validation

### Production (`prod`)

- **Scale**: 1-10 replicas (no scale-to-zero for availability)
- **SKU**: Premium Container Registry (geo-replication)
- **Zone Redundancy**: Enabled
- **Purpose**: Live production workload

## Cost Optimization

### Scale-to-Zero

Both backend and frontend scale to 0 replicas when idle:

- **Cold start**: ~2-5 seconds
- **Cost savings**: ~$108/year (estimated)
- **Active costs**: ~$0.18/day (only when running)

### Seasonal Usage

For applications with seasonal usage patterns:

1. Deploy infrastructure during active season
2. Let apps scale to zero during low activity
3. Destroy entire resource group at end of season
4. Redeploy next season

**Estimated Annual Cost**:

- Year-round (24/7): ~$156/year
- Seasonal (6 months): ~$48/year

## Deployment Workflows

### Infrastructure Workflow (`.github/workflows/infrastructure.yml`)

Triggered by:

- Push to `main` with changes to `infra/**`
- Manual workflow dispatch

Steps:

1. **Validate**: Bicep syntax and compilation
2. **Preview**: What-if deployment analysis
3. **Deploy**: Create/update Azure resources
4. **Output**: Registry and app URLs

### Application Deployment (`.github/workflows/deploy.yml`)

Triggered by:

- Push to `main` with changes to `backend/**` or `client/**`

Steps:

1. **Check Infrastructure**: Verify resources exist
2. **Build**: Docker images for backend and frontend
3. **Push**: Images to Container Registry
4. **Deploy**: Update Container Apps with new images

## Manual Operations

### Deploy Infrastructure

```bash
./scripts/deploy-infrastructure.sh [environment]
```

### Destroy Infrastructure

```bash
./scripts/destroy-infrastructure.sh
```

### Update Single Resource

```bash
az deployment group create \
  --resource-group shifts-dashboard-rg \
  --template-file infra/modules/container-app.bicep \
  --parameters @params.json
```

### View Deployment History

```bash
az deployment group list \
  --resource-group shifts-dashboard-rg \
  --output table
```

### Get Deployment Outputs

```bash
az deployment group show \
  --resource-group shifts-dashboard-rg \
  --name <deployment-name> \
  --query properties.outputs
```

## Monitoring and Logs

### View Container App Logs

```bash
# Backend logs
az containerapp logs show \
  --name shifts-dashboard-backend-dev \
  --resource-group shifts-dashboard-rg \
  --follow

# Frontend logs
az containerapp logs show \
  --name shifts-dashboard-frontend-dev \
  --resource-group shifts-dashboard-rg \
  --follow
```

### Query Log Analytics

```bash
# Get workspace ID
workspace=$(az monitor log-analytics workspace show \
  --resource-group shifts-dashboard-rg \
  --workspace-name shifts-dashboard-logs-<suffix> \
  --query customerId -o tsv)

# Query logs (requires Log Analytics Reader role)
az monitor log-analytics query \
  --workspace $workspace \
  --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(1h) | limit 100"
```

### View App Metrics

```bash
az containerapp show \
  --name shifts-dashboard-backend-dev \
  --resource-group shifts-dashboard-rg \
  --query "properties.{replicas:runningStatus, cpu:configuration.resources.cpu, memory:configuration.resources.memory}"
```

## Troubleshooting

### Bicep Validation Fails

```bash
# Build and see detailed errors
az bicep build --file infra/main.bicep

# Lint Bicep file
az bicep lint --file infra/main.bicep
```

### Deployment Fails

```bash
# Check deployment status
az deployment group show \
  --resource-group shifts-dashboard-rg \
  --name <deployment-name>

# View deployment operations
az deployment operation group list \
  --resource-group shifts-dashboard-rg \
  --name <deployment-name>
```

### Container App Not Starting

```bash
# Check app revision status
az containerapp revision list \
  --name shifts-dashboard-backend-dev \
  --resource-group shifts-dashboard-rg \
  --output table

# View specific revision
az containerapp revision show \
  --name <revision-name> \
  --app shifts-dashboard-backend-dev \
  --resource-group shifts-dashboard-rg
```

### Can't Pull from Registry

```bash
# Check registry credentials
az acr credential show \
  --name <registry-name>

# Test registry access
az acr login --name <registry-name>
docker pull <registry-name>.azurecr.io/<image-name>:latest
```

## Security Best Practices

### Registry

- [ ] Enable admin user only for development
- [ ] Use managed identities for production
- [ ] Enable Azure Defender for Container Registry
- [ ] Scan images for vulnerabilities

### Container Apps

- [ ] Use managed identities where possible
- [ ] Store secrets in Azure Key Vault
- [ ] Enable HTTPS only (no HTTP)
- [ ] Implement network policies for production

### Deployment

- [ ] Use environment-specific parameter files
- [ ] Never commit credentials to git
- [ ] Use Azure RBAC for access control
- [ ] Enable deployment protection rules in GitHub

## References

- [Azure Container Apps Documentation](https://learn.microsoft.com/azure/container-apps/)
- [Azure Bicep Documentation](https://learn.microsoft.com/azure/azure-resource-manager/bicep/)
- [Container Registry Documentation](https://learn.microsoft.com/azure/container-registry/)
- [Log Analytics Documentation](https://learn.microsoft.com/azure/azure-monitor/logs/)

## Support

For issues or questions:

1. Check deployment logs in Azure Portal
2. Review GitHub Actions workflow runs
3. Consult Bicep documentation for syntax issues
4. Contact DevOps team for access issues
