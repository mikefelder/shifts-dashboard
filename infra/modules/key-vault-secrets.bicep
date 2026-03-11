@description('Name of the existing Key Vault to write secrets into')
param keyVaultName string

@description('Shiftboard access key ID. Leave empty to skip creating this secret.')
@secure()
param sbAccessKey string = ''

@description('Shiftboard signature key. Leave empty to skip creating this secret.')
@secure()
param sbSignatureKey string = ''

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

// Uses the ARM control plane — unaffected by publicNetworkAccess: Disabled
resource secretAccessKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(sbAccessKey)) {
  parent: keyVault
  name: 'sb-access-key'
  properties: {
    value: sbAccessKey
  }
}

resource secretSignatureKey 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = if (!empty(sbSignatureKey)) {
  parent: keyVault
  name: 'sb-signature-key'
  properties: {
    value: sbSignatureKey
  }
}
