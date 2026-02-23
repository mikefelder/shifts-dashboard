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
./scripts/deploy-infrastructure.sh [environment]
```

**Examples:**

```bash
# Deploy to dev environment (default)
./scripts/deploy-infrastructure.sh dev

# Deploy to staging
./scripts/deploy-infrastructure.sh staging

# Deploy to production
./scripts/deploy-infrastructure.sh prod
```

**What it does:**

1. Validates Azure CLI installation and authentication
2. Creates resource group if needed
3. Validates Bicep templates
4. Shows preview of changes (what-if)
5. Prompts for confirmation
6. Deploys infrastructure
7. Outputs deployment results (registry, URLs)
8. Saves outputs to `.env.infrastructure`

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

- **SKU**: Basic (suitable for development)
- **Purpose**: Store Docker images for backend and frontend
- **Admin enabled**: Yes (for simplified deployment)

### Log Analytics Workspace

- **Retention**: 30 days
- **Purpose**: Centralized logging for Container Apps

### Container Apps Environment

- **Zone redundancy**: None (dev environment)
- **Logs**: Integrated with Log Analytics

### Container Apps (2)

- **Backend**: Node.js API (port 3000)
  - CPU: 0.5 cores
  - Memory: 1Gi
  - Scale: 0-3 replicas (scale-to-zero enabled)
- **Frontend**: Nginx-served React app (port 80)
  - CPU: 0.25 cores
  - Memory: 0.5Gi
  - Scale: 0-3 replicas (scale-to-zero enabled)

## Cost Optimization

**Scale-to-Zero**: Both apps scale down to 0 replicas when not in use, minimizing costs during inactive periods.

**Estimated Costs**:

- Active usage (24/7): ~$156/year
- With scale-to-zero during off-season: ~$48/year

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
