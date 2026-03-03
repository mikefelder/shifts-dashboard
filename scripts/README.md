# Deployment Scripts

This directory contains scripts for managing Azure infrastructure for the Shift Dashboard application.

## Prerequisites

- **Azure CLI**: Install from [here](https://docs.microsoft.com/cli/azure/install-azure-cli)
- **Azure Subscription**: Active Azure subscription with permissions to create resources
- **Logged in**: Run `az login` before using scripts

## Environment Variables

Set these before running scripts (optional, defaults provided):

```bash
export AZURE_RESOURCE_GROUP="shift-dashboard-rg"
export AZURE_LOCATION="eastus"
```

## Scripts

### `deploy-infrastructure.sh`

Deploys or updates Azure infrastructure using Bicep templates.

**Usage:**

```bash
./scripts/deploy-infrastructure.sh [environment] [options]
```

**Arguments:**

- `[environment]`: Environment name - dev, staging, or prod (default: dev)

**Options:**

- `--yes` or `-y`: Auto-approve deployment without confirmation (non-interactive mode for CI/CD)
- `--skip-preview`: Skip the what-if analysis to speed up deployment (use with caution)
- `--parameters <file>`: Use custom parameter file (default: infra/params/{env}.parameters.json)

**Examples:**

```bash
# Deploy to dev environment (default) with confirmation
./scripts/deploy-infrastructure.sh dev

# Deploy to staging with prompt
./scripts/deploy-infrastructure.sh staging

# Deploy to production with auto-approval (CI/CD pipeline)
./scripts/deploy-infrastructure.sh prod --yes

# Fast deployment to dev (skip what-if preview)
./scripts/deploy-infrastructure.sh dev --skip-preview

# Deploy with custom parameters
./scripts/deploy-infrastructure.sh staging --parameters custom.parameters.json

# Combine options for CI/CD
./scripts/deploy-infrastructure.sh prod --yes --skip-preview
```

**What it does:**

1. Validates Azure CLI installation and authentication
2. Validates jq (JSON processor) installation
3. Creates resource group if needed
4. Validates Bicep templates syntax
5. Shows preview of changes (what-if) unless --skip-preview is used
6. Prompts for confirmation unless --yes is used
7. Deploys infrastructure with environment-specific parameters
8. Validates deployment outputs
9. Displays deployment results (registry, URLs, Key Vault name)
10. Saves outputs to `.env.infrastructure` (gitignored)

### `destroy-infrastructure.sh`

Destroys the entire Azure resource group and all contained resources.

**⚠️ WARNING: This is destructive and cannot be undone!**

**Usage:**

```bash
./scripts/destroy-infrastructure.sh
```

**Safety features:**

- Lists all resources before deletion
- Requires typing resource group name to confirm
- Requires typing "DELETE" for final confirmation
- Runs deletion in background (can be cancelled)

**When to use:**

- End of seasonal usage (to save costs)
- Tearing down dev/test environments
- Starting fresh with clean infrastructure

## Infrastructure Components

The scripts deploy the following Azure resources:

### Container Registry

- **SKU**: Basic (cost-effective for all environments)
- **Purpose**: Store Docker images for backend and frontend
- **Authentication**: Managed identity (admin credentials disabled)
- **Security**: AcrPull RBAC role for container apps

### Log Analytics Workspace

- **Retention**: Environment-specific (30/60/90 days for dev/staging/prod)
- **Purpose**: Centralized logging for Container Apps
- **Pricing Tier**: PerGB2018

### Container Apps Environment

- **Zone redundancy**: Environment-specific (prod enabled)
- **Logs**: Integrated with Log Analytics
- **Apps**: Backend (Node.js) and Frontend (Nginx/React)

### Key Vault

- **Access Model**: RBAC-based (no access policies)
- **Secrets**: Shiftboard API credentials
- **Backend Access**: Key Vault Secrets User role via managed identity
- **Soft Delete**: 90-day retention

### Application Insights

- **Retention**: Environment-specific (30/60/90 days)
- **Purpose**: Application performance monitoring and telemetry
- **Integration**: Connected to Log Analytics Workspace

### Container Apps (2)

- **Backend**: Node.js API (port 3000)
  - System-assigned managed identity
  - Health probes (liveness, readiness, startup)
  - Autoscaling: HTTP (10 concurrent), CPU (70%), Memory (80%)
  - Environment-specific: 0.25-1.0 CPU, 0.5-2Gi memory, 0-10 replicas
  - RBAC: Key Vault Secrets User, AcrPull
- **Frontend**: Nginx-served React app (port 80)
  - System-assigned managed identity
  - Health probes (liveness, readiness, startup)
  - Autoscaling: HTTP (10 concurrent), CPU (70%), Memory (80%)
  - Environment-specific: 0.25-0.5 CPU, 0.5-1Gi memory, 0-5 replicas
  - RBAC: AcrPull
  - Runtime configuration: Backend URL injected at container start

## Cost Optimization

**Scale-to-Zero**: Dev environment apps scale down to 0 replicas when not in use, minimizing costs during inactive periods. Staging and production maintain minimum replicas for availability.

**Estimated Costs**:

- **Development**: ~$34-39/month (with scale-to-zero)
- **Staging**: ~$61-71/month (minimal replicas)
- **Production (active)**: ~$109-149/month (high availability, zone redundancy)
- **Production (off-season)**: ~$31/month (scale-to-zero)

## Workflow Integration

These scripts complement the GitHub Actions workflows:

- **Manual deployment**: Use scripts during development
- **Automated deployment**: GitHub Actions (`infrastructure.yml`) for production
- **CI/CD**: `deploy.yml` checks for infrastructure before deploying apps

## Troubleshooting

### "Azure CLI not found"

Install Azure CLI: https://docs.microsoft.com/cli/azure/install-azure-cli

### "Not logged in"

Run: `az login`

### "Bicep validation failed"

- Check syntax in `infra/main.bicep` and `infra/modules/*.bicep`
- Run: `az bicep build --file infra/main.bicep`

### "Resource group deletion stuck"

- Check status: `az group show --name <resource-group>`
- Force delete: `az group delete --name <resource-group> --yes --force`

### "Permission denied"

Ensure scripts are executable:

```bash
chmod +x scripts/*.sh
```

## Files Generated

- **deployment-output.json**: Full deployment output (gitignored)
- **.env.infrastructure**: Key outputs (registry URL, app URLs) - gitignored

## Best Practices

1. **Test first**: Always use `dev` environment for testing
2. **Review what-if**: Check preview before confirming deployment
3. **Version control**: Commit Bicep changes before deploying
4. **Document changes**: Update this README for new resources
5. **Clean up**: Use `destroy-infrastructure.sh` for unused environments
