@description('Location for all resources')
param location string = resourceGroup().location

@description('VNet name')
param vnetName string

@description('VNet address prefix')
param vnetAddressPrefix string = '10.0.0.0/16'

@description('Name for the Container Apps infrastructure subnet. Must be delegated to Microsoft.App/environments and a minimum of /21 for consumption-only environments.')
param containerAppsSubnetName string = 'container-apps-infra'

@description('Address prefix for the Container Apps infrastructure subnet (minimum /21 for consumption-only environment).')
param containerAppsSubnetPrefix string = '10.0.0.0/21'

@description('Name for the private endpoints subnet')
param privateEndpointsSubnetName string = 'private-endpoints'

@description('Address prefix for the private endpoints subnet (minimum /27).')
param privateEndpointsSubnetPrefix string = '10.0.8.0/27'

@description('Resource tags')
param tags object = {}

resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressPrefix
      ]
    }
    subnets: [
      {
        name: containerAppsSubnetName
        properties: {
          addressPrefix: containerAppsSubnetPrefix
          // Required: this subnet is exclusively managed by the Container Apps environment
          delegations: [
            {
              name: 'Microsoft.App.environments'
              properties: {
                serviceName: 'Microsoft.App/environments'
              }
            }
          ]
        }
      }
      {
        name: privateEndpointsSubnetName
        properties: {
          addressPrefix: privateEndpointsSubnetPrefix
          // Must be disabled to allow private endpoints to be placed in this subnet
          privateEndpointNetworkPolicies: 'Disabled'
        }
      }
    ]
  }
}

output vnetId string = vnet.id
output vnetName string = vnet.name
// Subnet IDs are stable once the VNet is created
output containerAppsSubnetId string = '${vnet.id}/subnets/${containerAppsSubnetName}'
output privateEndpointsSubnetId string = '${vnet.id}/subnets/${privateEndpointsSubnetName}'
