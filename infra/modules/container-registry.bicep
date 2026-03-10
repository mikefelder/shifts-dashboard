@description('Location for all resources')
param location string = resourceGroup().location

@description('Container Registry name')
param registryName string

@description('Admin user enabled')
param adminUserEnabled bool = false

@description('SKU for the Container Registry')
@allowed(['Basic', 'Standard', 'Premium'])
param sku string = 'Basic'

@description('Public network access')
@allowed(['Enabled', 'Disabled'])
param publicNetworkAccess string = 'Enabled'

@description('Resource tags')
param tags object = {}

resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  properties: {
    adminUserEnabled: adminUserEnabled
    publicNetworkAccess: publicNetworkAccess
    networkRuleBypassOptions: 'AzureServices'
  }
}

output registryName string = containerRegistry.name
output loginServer string = containerRegistry.properties.loginServer
output registryId string = containerRegistry.id
