#!/bin/bash

# Deploy Azure Infrastructure for Shift Dashboard
# Usage: ./scripts/deploy-infrastructure.sh [environment]
# Example: ./scripts/deploy-infrastructure.sh dev
# Options:
#   --yes          Skip confirmation prompts (for CI/CD)
#   --skip-preview Skip what-if preview

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="dev"
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-shift-dashboard-rg}
LOCATION=${AZURE_LOCATION:-eastus}
TEMPLATE_FILE="infra/main.bicep"
AUTO_APPROVE=false
SKIP_PREVIEW=false

# Parse options and positional arguments
while [ $# -gt 0 ]; do
  case "$1" in
    --yes)
      AUTO_APPROVE=true
      shift
      ;;
    --skip-preview)
      SKIP_PREVIEW=true
      shift
      ;;
    *)
      ENVIRONMENT="$1"
      shift
      ;;
  esac
done

PARAMETER_FILE="infra/params/${ENVIRONMENT}.parameters.json"

echo -e "${GREEN}Deploying Shift Dashboard Infrastructure${NC}"
echo "======================================================"
echo "Environment: $ENVIRONMENT"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "======================================================"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}ERROR: jq is not installed. Please install it first.${NC}"
    echo "macOS: brew install jq"
    echo "Ubuntu: sudo apt-get install jq"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}WARNING: Not logged into Azure. Running 'az login'...${NC}"
    az login
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}[OK]${NC} Using subscription: ${YELLOW}${SUBSCRIPTION}${NC}"
echo ""

# Create resource group if it doesn't exist
echo -e "${YELLOW}Checking resource group...${NC}"
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP${NC}"
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}[OK]${NC} Resource group created"
else
    echo -e "${GREEN}[OK]${NC} Resource group exists"
fi
echo ""

# Validate Bicep template
echo -e "${YELLOW}Validating Bicep template...${NC}"
if ! az bicep build --file $TEMPLATE_FILE; then
    echo -e "${RED}ERROR: Bicep validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Bicep validation successful"
echo ""

# Show what-if preview (unless skipped)
if [ "$SKIP_PREVIEW" = false ]; then
    echo -e "${YELLOW}Preview of changes:${NC}"
    if [ -f "$PARAMETER_FILE" ]; then
        echo "Using parameter file: $PARAMETER_FILE"
        az deployment group what-if \
            --resource-group $RESOURCE_GROUP \
            --template-file $TEMPLATE_FILE \
            --parameters @"$PARAMETER_FILE"
    else
        echo "Parameter file not found, using inline parameters"
        az deployment group what-if \
            --resource-group $RESOURCE_GROUP \
            --template-file $TEMPLATE_FILE \
            --parameters environment=$ENVIRONMENT
    fi
    echo ""
fi

# Confirm deployment
if [ "$AUTO_APPROVE" = false ]; then
    read -p "Do you want to proceed with deployment? (yes/no): " -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}Auto-approve enabled, proceeding with deployment${NC}"
    echo ""
fi

# Deploy infrastructure
echo -e "${GREEN}Deploying infrastructure...${NC}"
DEPLOYMENT_NAME="shift-dashboard-$(date +%Y%m%d-%H%M%S)"

if [ -f "$PARAMETER_FILE" ]; then
    echo "Using parameter file: $PARAMETER_FILE"
    az deployment group create \
        --name $DEPLOYMENT_NAME \
        --resource-group $RESOURCE_GROUP \
        --template-file $TEMPLATE_FILE \
        --parameters @"$PARAMETER_FILE" \
        --output json > deployment-output.json
else
    echo "Parameter file not found, using inline parameters"
    az deployment group create \
        --name $DEPLOYMENT_NAME \
        --resource-group $RESOURCE_GROUP \
        --template-file $TEMPLATE_FILE \
        --parameters environment=$ENVIRONMENT \
        --output json > deployment-output.json
fi

# Verify deployment output file exists
if [ ! -f deployment-output.json ]; then
    echo -e "${RED}ERROR: Deployment output file not created${NC}"
    exit 1
fi

# Extract outputs with error handling
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo "======================================================"
echo -e "${GREEN}Deployment Outputs:${NC}"
echo "======================================================"

REGISTRY_LOGIN_SERVER=$(jq -r '.properties.outputs.containerRegistryLoginServer.value // "N/A"' deployment-output.json)
BACKEND_URL=$(jq -r '.properties.outputs.backendUrl.value // "N/A"' deployment-output.json)
FRONTEND_URL=$(jq -r '.properties.outputs.frontendUrl.value // "N/A"' deployment-output.json)
KEY_VAULT_NAME=$(jq -r '.properties.outputs.keyVaultName.value // "N/A"' deployment-output.json)

if [ "$REGISTRY_LOGIN_SERVER" = "N/A" ] || [ "$BACKEND_URL" = "N/A" ]; then
    echo -e "${RED}ERROR: Failed to extract deployment outputs${NC}"
    echo "Deployment output file contents:"
    cat deployment-output.json
    exit 1
fi

echo "Container Registry: $REGISTRY_LOGIN_SERVER"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "Key Vault: $KEY_VAULT_NAME"
echo ""

# Save outputs to .env file for local development
cat > .env.infrastructure <<EOF
AZURE_CONTAINER_REGISTRY=$REGISTRY_LOGIN_SERVER
BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL
KEY_VAULT_NAME=$KEY_VAULT_NAME
EOF

echo -e "${GREEN}[OK]${NC} Outputs saved to .env.infrastructure"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Configure secrets in Key Vault: $KEY_VAULT_NAME"
echo "   - sb-access-key (Shiftboard Access Key)"
echo "   - sb-signature-key (Shiftboard Signature Key)"
echo "2. Push Docker images to: $REGISTRY_LOGIN_SERVER"
echo "   - Use GitHub Actions deploy workflow or:"
echo "   - Build and push manually (requires ACR login)"
echo "3. Access your applications:"
echo "   - Backend:  $BACKEND_URL"
echo "   - Frontend: $FRONTEND_URL"
echo ""
