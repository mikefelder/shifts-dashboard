#!/bin/bash

# Deploy Azure Infrastructure for Shift Dashboard
# Usage: ./scripts/deploy-infrastructure.sh [environment]
# Example: ./scripts/deploy-infrastructure.sh dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-shifts-dashboard-rg}
LOCATION=${AZURE_LOCATION:-eastus}
TEMPLATE_FILE="infra/main.bicep"

echo -e "${GREEN}🚀 Deploying Shift Dashboard Infrastructure${NC}"
echo "======================================================"
echo "Environment: $ENVIRONMENT"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "======================================================"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Azure. Running 'az login'...${NC}"
    az login
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✓${NC} Using subscription: ${YELLOW}${SUBSCRIPTION}${NC}"
echo ""

# Create resource group if it doesn't exist
echo -e "${YELLOW}🔍 Checking resource group...${NC}"
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Creating resource group: $RESOURCE_GROUP${NC}"
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}✓${NC} Resource group created"
else
    echo -e "${GREEN}✓${NC} Resource group exists"
fi
echo ""

# Validate Bicep template
echo -e "${YELLOW}🔍 Validating Bicep template...${NC}"
if ! az bicep build --file $TEMPLATE_FILE; then
    echo -e "${RED}❌ Bicep validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Bicep validation successful"
echo ""

# Show what-if preview
echo -e "${YELLOW}📋 Preview of changes:${NC}"
az deployment group what-if \
    --resource-group $RESOURCE_GROUP \
    --template-file $TEMPLATE_FILE \
    --parameters environment=$ENVIRONMENT
echo ""

# Confirm deployment
read -p "Do you want to proceed with deployment? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

# Deploy infrastructure
echo -e "${GREEN}🚀 Deploying infrastructure...${NC}"
DEPLOYMENT_NAME="shifts-dashboard-$(date +%Y%m%d-%H%M%S)"

az deployment group create \
    --name $DEPLOYMENT_NAME \
    --resource-group $RESOURCE_GROUP \
    --template-file $TEMPLATE_FILE \
    --parameters environment=$ENVIRONMENT \
    --output json > deployment-output.json

# Extract outputs
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "======================================================"
echo -e "${GREEN}Deployment Outputs:${NC}"
echo "======================================================"

REGISTRY_LOGIN_SERVER=$(jq -r '.properties.outputs.containerRegistryLoginServer.value' deployment-output.json)
BACKEND_URL=$(jq -r '.properties.outputs.backendUrl.value' deployment-output.json)
FRONTEND_URL=$(jq -r '.properties.outputs.frontendUrl.value' deployment-output.json)

echo "Container Registry: $REGISTRY_LOGIN_SERVER"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Save outputs to .env file for local development
cat > .env.infrastructure <<EOF
AZURE_CONTAINER_REGISTRY=$REGISTRY_LOGIN_SERVER
BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL
EOF

echo -e "${GREEN}✓${NC} Outputs saved to .env.infrastructure"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Push Docker images to: $REGISTRY_LOGIN_SERVER"
echo "2. Deploy applications using GitHub Actions or:"
echo "   ./scripts/deploy-apps.sh"
echo ""
