@description('Location for all resources')
param location string = resourceGroup().location

@description('Key Vault name')
param keyVaultName string

@description('Enable RBAC authorization (recommended over access policies)')
param enableRbacAuthorization bool = true

@description('Enable purge protection (recommended for production; cannot be disabled once enabled)')
param enablePurgeProtection bool = false

@description('Default network action')
@allowed(['Allow', 'Deny'])
param networkDefaultAction string = 'Allow'

@description('Whether to allow public network access. Set to Disabled when all access is routed via a private endpoint.')
@allowed(['Enabled', 'Disabled'])
param publicNetworkAccess string = 'Enabled'

@description('Resource tags')
param tags object = {}

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    tenantId: subscription().tenantId
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: enablePurgeProtection ? true : null
    enableRbacAuthorization: enableRbacAuthorization
    accessPolicies: []
    sku: {
      name: 'standard'
      family: 'A'
    }
    publicNetworkAccess: publicNetworkAccess
    networkAcls: {
      defaultAction: networkDefaultAction
      bypass: 'AzureServices'
    }
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
