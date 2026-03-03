# Azure Infrastructure

This directory contains Infrastructure as Code (IaC) for the Shift Dashboard application using Azure Bicep.

## Architecture

The infrastructure deploys a complete Azure Container Apps environment with:

```
┌─────────────────────────────────────────────────────────────┐
│ Resource Group (shift-dashboard-rg)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Container Registry (ACR)                             │  │
│  │ - Stores Docker images (managed identity pull)      │  │
│  │ - Admin credentials disabled                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Log Analytics Workspace                              │  │
│  │ - Centralized logging                               │  │
│  │ - Environment-specific retention (30/60/90 days)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Container Apps Environment                           │  │
│  │ ┌─────────────────────┐  ┌────────────────────────┐ │  │
│  │ │ Backend Container   │  │ Frontend Container    │ │  │
│  │ │ - Node.js API       │  │ - React SPA (Nginx)   │ │  │
│  │ │ - Port 3000         │  │ - Port 80            │ │  │
│  │ │ - Managed Identity  │  │ - Managed Identity   │ │  │
│  │ │ - Health Probes     │  │ - Health Probes      │ │  │
│  │ │ - Autoscaling (3x)  │  │ - Autoscaling (3x)   │ │  │
│  │ │ - Env-specific CPU  │  │ - Env-specific CPU   │ │  │
│  │ └─────────────────────┘  └────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Key Vault (RBAC-based)                               │  │
│  │ - Shiftboard API credentials                        │  │
│  │ - Backend: Key Vault Secrets User role              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Application Insights                                 │  │
│  │ - Environment-specific retention (30/60/90 days)    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
infra/
├── main.bicep                         # Main orchestration template
├── main.json                          # Generated ARM template (gitignored)
├── modules/
│   ├── container-registry.bicep       # Azure Container Registry
│   ├── container-apps-env.bicep       # Container Apps Environment + Log Analytics
│   ├── container-app.bicep            # Generic Container App template
│   ├── key-vault.bicep                # Key Vault with RBAC
│   ├── app-insights.bicep             # Application Insights
│   └── role-assignment.bicep          # RBAC role assignments (NEW)
└── params/
    ├── dev.parameters.json            # Development environment parameters
    ├── staging.parameters.json        # Staging environment parameters
    └── prod.parameters.json           # Production environment parameters
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
export AZURE_RESOURCE_GROUP="shift-dashboard-rg"
export AZURE_LOCATION="eastus"
```

### 3. Deploy Infrastructure

```bash
./scripts/deploy-infrastructure.sh dev
```

Or manually:

```bash
# Create resource group
az group create --name shift-dashboard-rg --location eastus

# Validate Bicep
az bicep build --file infra/main.bicep

# Preview changes
az deployment group what-if \
  --resource-group shift-dashboard-rg \
  --template-file infra/main.bicep \
  --parameters environment=dev

# Deploy
az deployment group create \
  --resource-group shift-dashboard-rg \
  --template-file infra/main.bicep \
  --parameters environment=dev
```

## Modules

### `main.bicep`

Main orchestration template that combines all modules:

- **Parameters**: `location`, `environment` (dev/staging/prod), `appName`
- **Environment Configs**: Defines CPU, memory, replicas, retention per environment
- **Resources**: Calls all module templates, creates RBAC role assignments
- **Outputs**: Registry login server, app URLs, Key Vault name
- **Tags**: All resources tagged with Environment, Application, ManagedBy

### `modules/container-registry.bicep`

Azure Container Registry for storing Docker images:

- **SKU**: Environment-specific — Basic (dev), Standard (staging/prod)
- **Admin credentials**: Disabled (managed identity authentication only)
- **Network**: Public access (configurable parameter)
- **Security**: Image pull via AcrPull RBAC role
- **Tags**: Resource tagging support

### `modules/container-apps-env.bicep`

Container Apps Environment with Log Analytics:

- **Log Retention**: Environment-specific (30/60/90 days for dev/staging/prod)
- **Pricing Tier**: PerGB2018 for Log Analytics
- **Zone Redundancy**: Configurable per environment (prod enabled)
- **Tags**: Resource tagging support

### `modules/key-vault.bicep`

Azure Key Vault for secrets management:

- **Access Model**: RBAC-based (not access policies)
- **Soft Delete**: 90-day retention enabled
- **Purge Protection**: Configurable (recommended for production)
- **Network Access**: Configurable (Allow/Deny public access)
- **Tags**: Resource tagging support

### `modules/app-insights.bicep`

Application Insights for monitoring and telemetry:

- **Retention**: Environment-specific (30/60/90 days)
- **Connected to**: Log Analytics Workspace
- **Tags**: Resource tagging support

### `modules/container-app.bicep`

Reusable template for deploying Container Apps:

- **Identity**: System-assigned managed identity
- **Authentication**: Registry via managed identity (no credentials)
- **Health Probes**:
  - Liveness: Restarts unhealthy containers (10s period)
  - Readiness: Removes from load balancer when not ready (5s period)
  - Startup: Allows slow start without liveness failures (3s period, 30 failures)
- **Autoscaling**:
  - HTTP concurrent requests (threshold: 10)
  - CPU usage (threshold: 70%)
  - Memory usage (threshold: 80%)
- **Resource Allocation**: Environment-specific CPU and memory
- **Scaling**: Environment-specific min/max replicas
- **Ingress**: External HTTPS with auto SSL/TLS
- **Secrets**: Key Vault secrets referenced via managed identity
- **Tags**: Resource tagging support

### `modules/role-assignment.bicep` (NEW)

RBAC role assignment module for managed identities:

- **Roles Supported**:
  - Key Vault Secrets User (4633458b-17de-408a-b874-0445c86b69e6)
  - AcrPull (7f951dda-4ed3-4680-a7ca-43fe172d538d)
- **Scope**: Resource or resource group level
- **Usage**: Assigns roles to container app managed identities

## Environments

### Development (`dev`)

- **Backend**: 0.25 CPU / 0.5Gi memory / 0-2 replicas (scale-to-zero)
- **Frontend**: 0.25 CPU / 0.5Gi memory / 0-2 replicas (scale-to-zero)
- **Log Retention**: 30 days
- **App Insights Retention**: 30 days
- **Zone Redundancy**: Disabled
- **Purpose**: Development and testing
- **Estimated Cost**: ~$34-39/month

### Staging (`staging`)

- **Backend**: 0.5 CPU / 1.0Gi memory / 1-5 replicas
- **Frontend**: 0.25 CPU / 0.5Gi memory / 1-3 replicas
- **Log Retention**: 60 days
- **App Insights Retention**: 60 days
- **Zone Redundancy**: Disabled
- **Purpose**: Pre-production validation
- **Estimated Cost**: ~$61-71/month

### Production (`prod`)

- **Backend**: 1.0 CPU / 2.0Gi memory / 2-10 replicas (no scale-to-zero)
- **Frontend**: 0.5 CPU / 1.0Gi memory / 1-5 replicas (no scale-to-zero)
- **Log Retention**: 90 days
- **App Insights Retention**: 90 days
- **Zone Redundancy**: Enabled
- **Purpose**: Live production workload
- **Estimated Cost**: ~$109-149/month (active) or ~$31/month (off-season)

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
  --resource-group shift-dashboard-rg \
  --template-file infra/modules/container-app.bicep \
  --parameters @params.json
```

### View Deployment History

```bash
az deployment group list \
  --resource-group shift-dashboard-rg \
  --output table
```

### Get Deployment Outputs

```bash
az deployment group show \
  --resource-group shift-dashboard-rg \
  --name <deployment-name> \
  --query properties.outputs
```

## Monitoring and Logs

### View Container App Logs

```bash
# Backend logs
az containerapp logs show \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg \
  --follow

# Frontend logs
az containerapp logs show \
  --name shift-dashboard-frontend-dev \
  --resource-group shift-dashboard-rg \
  --follow
```

### Query Log Analytics

```bash
# Get workspace ID
workspace=$(az monitor log-analytics workspace show \
  --resource-group shift-dashboard-rg \
  --workspace-name shift-dashboard-logs-<suffix> \
  --query customerId -o tsv)

# Query logs (requires Log Analytics Reader role)
az monitor log-analytics query \
  --workspace $workspace \
  --analytics-query "ContainerAppConsoleLogs_CL | where TimeGenerated > ago(1h) | limit 100"
```

### View App Metrics

```bash
az containerapp show \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg \
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
  --resource-group shift-dashboard-rg \
  --name <deployment-name>

# View deployment operations
az deployment operation group list \
  --resource-group shift-dashboard-rg \
  --name <deployment-name>
```

### Container App Not Starting

```bash
# Check app revision status
az containerapp revision list \
  --name shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg \
  --output table

# View specific revision
az containerapp revision show \
  --name <revision-name> \
  --app shift-dashboard-backend-dev \
  --resource-group shift-dashboard-rg
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
