// Azure Key Vault for storing secrets
// This should be deployed before the main infrastructure

// Parameters
@description('The name of the Key Vault')
param keyVaultName string

@description('The Azure region where resources will be deployed')
param location string = resourceGroup().location

@description('The environment name (dev, staging, prod)')
param environment string = 'prod'

@description('The Object ID of the user/service principal that will manage secrets')
param adminObjectId string

@description('Tags to apply to resources')
param tags object = {
  Application: 'HLSR Shiftboard Reporting'
  Environment: environment
  ManagedBy: 'Bicep'
}

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: adminObjectId
        permissions: {
          secrets: [
            'get'
            'list'
            'set'
            'delete'
            'recover'
            'backup'
            'restore'
          ]
        }
      }
    ]
  }
}

// Outputs
output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
output keyVaultUri string = keyVault.properties.vaultUri
