@description('Principal ID to assign the role to')
param principalId string

@description('Role Definition ID (use built-in role IDs)')
param roleDefinitionId string

@description('Key Vault name for secrets access')
param keyVaultName string = ''

@description('Container Registry name for pull access')
param containerRegistryName string = ''

// Built-in Azure Role Definition IDs (constant across all subscriptions)
var keyVaultSecretsUserRole = '4633458b-17de-408a-b874-0445c86b69e6'
var acrPullRole = '7f951dda-4ed3-4680-a7ca-43fe172d538d'

// Reference existing Key Vault if provided
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = if (!empty(keyVaultName)) {
  name: keyVaultName
}

// Reference existing Container Registry if provided
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = if (!empty(containerRegistryName)) {
  name: containerRegistryName
}

// Key Vault role assignment
resource kvRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(keyVaultName) && roleDefinitionId == keyVaultSecretsUserRole) {
  name: guid(principalId, keyVaultSecretsUserRole, keyVault.id)
  scope: keyVault
  properties: {
    principalId: principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', keyVaultSecretsUserRole)
    principalType: 'ServicePrincipal'
  }
}

// Container Registry role assignment
resource acrRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(containerRegistryName) && roleDefinitionId == acrPullRole) {
  name: guid(principalId, acrPullRole, containerRegistry.id)
  scope: containerRegistry
  properties: {
    principalId: principalId
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRole)
    principalType: 'ServicePrincipal'
  }
}

output roleAssignmentId string = !empty(keyVaultName) ? kvRoleAssignment.id : acrRoleAssignment.id
