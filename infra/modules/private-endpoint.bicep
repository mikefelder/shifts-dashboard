@description('Location for all resources')
param location string = resourceGroup().location

@description('Private endpoint resource name')
param privateEndpointName string

@description('Subnet ID in which to place the private endpoint NIC')
param subnetId string

@description('Resource ID of the Key Vault to connect via Private Link')
param keyVaultId string

@description('VNet ID — the private DNS zone will be linked to this VNet so all resources in it can resolve the KV hostname to the private IP')
param vnetId string

@description('Resource tags')
param tags object = {}

// Key Vault uses this well-known private DNS zone name
var privateDnsZoneName = 'privatelink.vaultcore.azure.net'

resource privateEndpoint 'Microsoft.Network/privateEndpoints@2023-05-01' = {
  name: privateEndpointName
  location: location
  tags: tags
  properties: {
    subnet: {
      id: subnetId
    }
    privateLinkServiceConnections: [
      {
        name: '${privateEndpointName}-connection'
        properties: {
          privateLinkServiceId: keyVaultId
          // 'vault' is the only sub-resource for Key Vault
          groupIds: [
            'vault'
          ]
        }
      }
    ]
  }
}

// Private DNS zone so the KV FQDN resolves to the private endpoint IP within the VNet
resource privateDnsZone 'Microsoft.Network/privateDnsZones@2020-06-01' = {
  name: privateDnsZoneName
  // Private DNS zones are always 'global'
  location: 'global'
  tags: tags
}

// Link the DNS zone to the VNet — without this, resources in the VNet cannot resolve the private hostname
resource dnsVnetLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2020-06-01' = {
  parent: privateDnsZone
  name: '${privateEndpointName}-vnet-link'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: vnetId
    }
  }
}

// DNS zone group automatically creates an A record in the private DNS zone pointing to the PE NIC's private IP
resource dnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2023-05-01' = {
  parent: privateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'privatelink-vaultcore-azure-net'
        properties: {
          privateDnsZoneId: privateDnsZone.id
        }
      }
    ]
  }
}

output privateEndpointId string = privateEndpoint.id
output privateDnsZoneId string = privateDnsZone.id
