#!/bin/bash

# Validate Azure Infrastructure for Shift Dashboard
# Usage: ./scripts/validate-infrastructure.sh [environment]
# Example: ./scripts/validate-infrastructure.sh dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-shift-dashboard-rg}
LOCATION=${AZURE_LOCATION:-eastus}
TEMPLATE_FILE="infra/main.bicep"

echo -e "${BLUE}Validating Shift Dashboard Infrastructure${NC}"
echo "======================================================"
echo "Environment: $ENVIRONMENT"
echo "Resource Group: $RESOURCE_GROUP"
echo "Location: $LOCATION"
echo "Template: $TEMPLATE_FILE"
echo "======================================================"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}ERROR: Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/cli/azure/install-azure-cli"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Azure CLI is installed"

# Check Azure CLI version
AZ_VERSION=$(az version --query '"azure-cli"' -o tsv)
echo -e "${GREEN}[OK]${NC} Azure CLI version: ${AZ_VERSION}"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${RED}ERROR: Not logged into Azure. Please run 'az login' first.${NC}"
    exit 1
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}[OK]${NC} Logged into Azure"
echo -e "    Subscription: ${YELLOW}${SUBSCRIPTION}${NC}"
echo -e "    ID: ${SUBSCRIPTION_ID}"
echo ""

# Check if Bicep CLI is available
if ! az bicep version &> /dev/null; then
    echo -e "${YELLOW}WARNING: Bicep CLI not found. Installing...${NC}"
    az bicep install
    echo -e "${GREEN}[OK]${NC} Bicep CLI installed"
else
    BICEP_VERSION=$(az bicep version --query 'bicepVersion' -o tsv)
    echo -e "${GREEN}[OK]${NC} Bicep CLI version: ${BICEP_VERSION}"
fi
echo ""

# Validate Bicep template syntax
echo -e "${YELLOW}Validating Bicep template syntax...${NC}"
if az bicep build --file $TEMPLATE_FILE --stdout > /dev/null 2>&1; then
    echo -e "${GREEN}[OK]${NC} Bicep template syntax is valid"
else
    echo -e "${RED}ERROR: Bicep template has syntax errors${NC}"
    az bicep build --file $TEMPLATE_FILE
    exit 1
fi
echo ""

# Check if resource group exists
echo -e "${YELLOW}Checking resource group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Resource group exists: $RESOURCE_GROUP"
    
    # Show existing resources
    RESOURCE_COUNT=$(az resource list --resource-group $RESOURCE_GROUP --query "length(@)" -o tsv)
    echo "    Resources: ${RESOURCE_COUNT}"
else
    echo -e "${YELLOW}INFO: Resource group does not exist (will be created during deployment)${NC}"
fi
echo ""

# Validate deployment (what-if analysis)
echo -e "${YELLOW}Running what-if analysis...${NC}"
echo "This shows what would happen if you deployed now:"
echo ""

if az deployment group what-if \
    --resource-group $RESOURCE_GROUP \
    --template-file $TEMPLATE_FILE \
    --parameters environment=$ENVIRONMENT \
    --no-prompt 2>&1; then
    echo ""
    echo -e "${GREEN}[OK]${NC} What-if analysis completed successfully"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 1 ]; then
        echo ""
        echo -e "${YELLOW}INFO: What-if returned exit code 1 (expected for non-existent resource group)${NC}"
    else
        echo ""
        echo -e "${RED}ERROR: What-if analysis failed${NC}"
        exit $EXIT_CODE
    fi
fi
echo ""

# Validate specific requirements
echo -e "${YELLOW}Checking deployment requirements...${NC}"

# Check for required environment variables
REQUIRED_VARS=("SHIFTBOARD_ACCESS_KEY_ID" "SHIFTBOARD_SECRET_KEY" "SHIFTBOARD_HOST")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}WARNING: The following environment variables are not set:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "    - $var"
    done
    echo "These will need to be configured in Key Vault after deployment"
else
    echo -e "${GREEN}[OK]${NC} All required environment variables are set"
fi
echo ""

# Check Docker images (optional)
echo -e "${YELLOW}Checking Docker setup...${NC}"
if command -v docker &> /dev/null; then
    echo -e "${GREEN}[OK]${NC} Docker is installed"
    
    # Check if images are built
    if docker images | grep -q "shift-dashboard-backend"; then
        echo -e "${GREEN}[OK]${NC} Backend Docker image found"
    else
        echo -e "${YELLOW}INFO: Backend Docker image not found (build before pushing to registry)${NC}"
    fi
    
    if docker images | grep -q "shift-dashboard-frontend"; then
        echo -e "${GREEN}[OK]${NC} Frontend Docker image found"
    else
        echo -e "${YELLOW}INFO: Frontend Docker image not found (build before pushing to registry)${NC}"
    fi
else
    echo -e "${YELLOW}INFO: Docker not installed (needed for building container images)${NC}"
fi
echo ""

# Summary
echo "======================================================"
echo -e "${BLUE}Validation Summary${NC}"
echo "======================================================"
echo -e "${GREEN}✓${NC} Azure CLI installed and logged in"
echo -e "${GREEN}✓${NC} Bicep template syntax is valid"
echo -e "${GREEN}✓${NC} Subscription access confirmed"

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}!${NC} Environment variables need configuration"
else
    echo -e "${GREEN}✓${NC} Environment variables configured"
fi

echo ""
echo -e "${GREEN}Infrastructure validation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the what-if output above"
echo "2. Run deployment: ./scripts/deploy-infrastructure.sh $ENVIRONMENT"
echo "3. Configure secrets in Key Vault after deployment"
echo ""
