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

- **Azure Subscription**: Active subscription

  ```bash
  az account show
  ```

- **Resource providers registered**:
  ```bash
  az provider register --namespace Microsoft.App
  az provider register --namespace Microsoft.AlertsManagement
  az provider register --namespace Microsoft.OperationalInsights
  ```

## Quick Start

### 1. Login to Azure

```bash
az login
az account set --subscription "<your-subscription-id>"
```

### 2. Create the Service Principal for GitHub Actions (OIDC)

The CI/CD workflows use OpenID Connect (OIDC) federated credentials — no long-lived secrets required.

```bash
# Create the app registration and service principal
az ad app create --display-name shift-dashboard-sp
APP_ID=$(az ad app list --filter "displayName eq 'shift-dashboard-sp'" --query "[0].appId" -o tsv)
az ad sp create --id $APP_ID
```

Note the following values — you'll need them for GitHub secrets:

| Value                   | How to get it                             |
| ----------------------- | ----------------------------------------- |
| `AZURE_CLIENT_ID`       | `echo $APP_ID`                            |
| `AZURE_TENANT_ID`       | `az account show --query tenantId -o tsv` |
| `AZURE_SUBSCRIPTION_ID` | `az account show --query id -o tsv`       |

### 3. Configure Federated Credentials

Create federated credentials for each environment and branch that triggers workflows:

```bash
APP_OBJ_ID=$(az ad app list --filter "displayName eq 'shift-dashboard-sp'" --query "[0].id" -o tsv)

# For each GitHub environment (dev, uat, prod)
for ENV in dev uat prod; do
  az ad app federated-credential create --id $APP_OBJ_ID --parameters '{
    "name": "github-env-'$ENV'",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:<owner>/<repo>:environment:'$ENV'",
    "audiences": ["api://AzureADTokenExchange"]
  }'
done

# For branch-based triggers
az ad app federated-credential create --id $APP_OBJ_ID --parameters '{
  "name": "github-develop",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<owner>/<repo>:ref:refs/heads/develop",
  "audiences": ["api://AzureADTokenExchange"]
}'

az ad app federated-credential create --id $APP_OBJ_ID --parameters '{
  "name": "github-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<owner>/<repo>:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}'

# For pull request triggers
az ad app federated-credential create --id $APP_OBJ_ID --parameters '{
  "name": "github-pr",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:<owner>/<repo>:pull_request",
  "audiences": ["api://AzureADTokenExchange"]
}'
```

Replace `<owner>/<repo>` with your GitHub repository (e.g., `mikefelder/shifts-dashboard`).

### 4. Assign Azure Roles to the Service Principal

The service principal needs multiple roles. Assign them **per environment resource group**.

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Contributor — create and manage all resources
az role assignment create \
  --assignee $APP_ID \
  --role Contributor \
  --scope /subscriptions/$SUBSCRIPTION_ID
```

After the first infra deployment creates the resource group, add scoped roles:

```bash
RG_NAME="shift-dashboard-dev-rg"  # adjust per environment

# User Access Administrator — required to create RBAC role assignments
# (e.g., AcrPull for container apps, Key Vault Secrets User for backend)
az role assignment create \
  --assignee $APP_ID \
  --role "User Access Administrator" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME

# Key Vault Secrets Officer — required to write secrets during deployment
# (the "Populate Key Vault Secrets" workflow step)
KV_NAME="<your-key-vault-name>"  # from deployment outputs
az role assignment create \
  --assignee $APP_ID \
  --role "Key Vault Secrets Officer" \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG_NAME/providers/Microsoft.KeyVault/vaults/$KV_NAME
```

**Summary of required roles:**

| Role                        | Scope          | Purpose                                           |
| --------------------------- | -------------- | ------------------------------------------------- |
| `Contributor`               | Subscription   | Create/manage Azure resources                     |
| `User Access Administrator` | Resource Group | Create RBAC role assignments (AcrPull, KV access) |
| `Key Vault Secrets Officer` | Key Vault      | Write Shiftboard API secrets during deployment    |

> **Note**: `User Access Administrator` and `Key Vault Secrets Officer` must be assigned **after** the first infrastructure deployment creates the resource group and Key Vault. The first run will partially succeed (resources created, role assignments fail), then re-run after adding these roles.

### 5. Configure GitHub Secrets

In your GitHub repository, go to **Settings → Environments** and create environments for `dev`, `uat`, and `prod`. Add these secrets to each:

| Secret                  | Value                             |
| ----------------------- | --------------------------------- |
| `AZURE_CLIENT_ID`       | Service principal app (client) ID |
| `AZURE_TENANT_ID`       | Azure AD tenant ID                |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID             |
| `SB_ACCESS_KEY`         | Shiftboard API access key         |
| `SB_SIGNATURE_KEY`      | Shiftboard API signature key      |

### 6. Deploy Infrastructure

```bash
./scripts/deploy-infrastructure.sh dev
```

Or manually:

```bash
# Create resource group
az group create --name shift-dashboard-dev-rg --location eastus

# Validate Bicep
az bicep build --file infra/main.bicep

# Preview changes
az deployment group what-if \
  --resource-group shift-dashboard-dev-rg \
  --template-file infra/main.bicep \
  --parameters @infra/params/dev.parameters.json

# Deploy (initial — uses placeholder images)
az deployment group create \
  --resource-group shift-dashboard-dev-rg \
  --template-file infra/main.bicep \
  --parameters @infra/params/dev.parameters.json
```

### 7. Post-Deployment: Assign Scoped Roles

After the first successful deployment, assign the scoped roles from Step 4 (User Access Administrator, Key Vault Secrets Officer), then re-run the workflow to complete any previously-failed role assignment and secret population steps.

## Placeholder Images

On first deployment, no application images exist in the Container Registry yet. The Bicep templates use the `useDefaultImage` parameter (defaults to `true`) to deploy a public placeholder image (`mcr.microsoft.com/azuredocs/containerapps-helloworld:latest`) so the container apps can start and pass health probes.

When the app deploy workflow runs, it pushes real images and updates the container apps directly via `az containerapp update`, so the placeholder is automatically replaced.

To deploy with real images via Bicep (e.g., redeployment after images exist):

```bash
az deployment group create \
  --resource-group shift-dashboard-dev-rg \
  --template-file infra/main.bicep \
  --parameters @infra/params/dev.parameters.json useDefaultImage=false
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

- Push to `main` or `develop` with changes to `infra/**`
- Manual workflow dispatch (select environment: dev/uat/prod)

**Authentication**: OIDC via `azure/login@v2` (federated credentials, no stored secrets)

Steps:

1. **Validate**: Bicep syntax and compilation
2. **Preview**: Ensures resource group exists, then runs what-if deployment analysis
3. **Deploy**: Create/update Azure resources (uses placeholder images on first deployment)
4. **Secrets**: Populates Key Vault with Shiftboard API credentials
5. **Output**: Registry login server, app URLs, Key Vault name

### Application Deployment (`.github/workflows/deploy.yml`)

Triggered by:

- Push to `main` with changes to `backend/**` or `client/**`
- After infrastructure workflow completes on `main`
- Manual workflow dispatch

**Authentication**: OIDC via `azure/login@v2`

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

### OIDC Login Fails ("No subscriptions found")

This means the service principal exists and the federated credential matched, but the SP has no role on the subscription.

```bash
# Check current role assignments
az role assignment list --assignee <APP_ID> -o table

# Grant Contributor if missing
az role assignment create \
  --assignee <APP_ID> \
  --role Contributor \
  --scope /subscriptions/<SUBSCRIPTION_ID>
```

Also verify the GitHub environment secrets (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`) are set correctly.

### Role Assignment Failures ("does not have permission to perform action")

The SP needs `User Access Administrator` to create RBAC role assignments:

```bash
az role assignment create \
  --assignee <APP_ID> \
  --role "User Access Administrator" \
  --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RG_NAME>
```

### Key Vault Secret Write Fails ("Forbidden")

The SP needs `Key Vault Secrets Officer` on the vault:

```bash
az role assignment create \
  --assignee <APP_ID> \
  --role "Key Vault Secrets Officer" \
  --scope /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RG_NAME>/providers/Microsoft.KeyVault/vaults/<KV_NAME>
```

### Container App Provisioning Timeout ("Operation expired")

Usually caused by health probes failing. Check that `targetPort` and `healthProbePath` match the running container image. On first deployment, use `useDefaultImage=true` (the default) to deploy a working placeholder image.

```bash
# Check revision status
az containerapp revision list \
  --name <app-name> \
  --resource-group <rg-name> \
  -o table

# Delete a stuck app and redeploy
az containerapp delete --name <app-name> --resource-group <rg-name> --yes
```

### Resource Provider Not Registered

```bash
# Register required providers
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.AlertsManagement
az provider register --namespace Microsoft.OperationalInsights
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
