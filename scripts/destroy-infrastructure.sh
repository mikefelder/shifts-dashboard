#!/bin/bash

# Destroy Azure Infrastructure for Shifts Dashboard
# Usage: ./scripts/destroy-infrastructure.sh
# WARNING: This will delete ALL resources in the resource group

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RESOURCE_GROUP=${AZURE_RESOURCE_GROUP:-shifts-dashboard-rg}

echo -e "${RED}⚠️  WARNING: DESTRUCTIVE OPERATION${NC}"
echo "======================================================"
echo "This will DELETE the following resource group:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "======================================================"
echo ""

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed.${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged into Azure. Running 'az login'...${NC}"
    az login
fi

# Show current subscription
SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "Using subscription: ${YELLOW}${SUBSCRIPTION}${NC}"
echo ""

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}Resource group '$RESOURCE_GROUP' does not exist. Nothing to delete.${NC}"
    exit 0
fi

# List resources that will be deleted
echo -e "${YELLOW}Resources that will be deleted:${NC}"
az resource list --resource-group $RESOURCE_GROUP --query "[].{Name:name, Type:type}" -o table
echo ""

# Confirmation with resource group name
echo -e "${RED}THIS CANNOT BE UNDONE!${NC}"
read -p "Type the resource group name to confirm deletion [$RESOURCE_GROUP]: " -r
echo ""

if [[ "$REPLY" != "$RESOURCE_GROUP" ]]; then
    echo -e "${GREEN}Deletion cancelled${NC}"
    exit 0
fi

# Final confirmation
read -p "Are you absolutely sure? Type 'DELETE' to proceed: " -r
echo ""

if [[ "$REPLY" != "DELETE" ]]; then
    echo -e "${GREEN}Deletion cancelled${NC}"
    exit 0
fi

# Delete resource group
echo -e "${RED}🗑️  Deleting resource group: $RESOURCE_GROUP${NC}"
az group delete --name $RESOURCE_GROUP --yes --no-wait

echo ""
echo -e "${GREEN}✓${NC} Deletion initiated (running in background)"
echo ""
echo "To check deletion status:"
echo "  az group show --name $RESOURCE_GROUP"
echo ""
echo "Clean up local files:"
rm -f deployment-output.json .env.infrastructure
echo -e "${GREEN}✓${NC} Cleaned up local deployment files"
echo ""
