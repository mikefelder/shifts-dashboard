targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, uat, prod)')
@allowed(['dev', 'uat', 'prod'])
param environment string = 'dev'

@description('Application name')
param appName string = 'shift-dashboard'

@description('Unique suffix for resource names')
param uniqueSuffix string = uniqueString(resourceGroup().id)

@description('SKU for the Azure Container Registry. Defaults to Basic; override to Standard in deployment pipelines when needed.')
@allowed(['Basic', 'Standard', 'Premium'])
param containerRegistrySku string = 'Basic'

@description('Optional comma-separated committee codes to scope this deployment (e.g. "ITC", "ITC,FINANCE"). Pass "ALL" or leave empty to disable committee filtering.')
param committeeCodes string = ''

@description('Use a public placeholder image for initial infra deployment (before real images are pushed to ACR)')
param useDefaultImage bool = true

// Environment-specific configurations
var environmentConfig = {
  dev: {
    logRetentionDays: 30
    backendCpu: '0.25'
    backendMemory: '0.5Gi'
    backendMinReplicas: 0
    backendMaxReplicas: 2
    frontendCpu: '0.25'
    frontendMemory: '0.5Gi'
    frontendMinReplicas: 0
    frontendMaxReplicas: 2
    zoneRedundant: false
    networkDefaultAction: 'Allow'
    enablePurgeProtection: false
  }
  uat: {
    logRetentionDays: 60
    backendCpu: '0.5'
    backendMemory: '1Gi'
    backendMinReplicas: 1
    backendMaxReplicas: 5
    frontendCpu: '0.25'
    frontendMemory: '0.5Gi'
    frontendMinReplicas: 1
    frontendMaxReplicas: 5
    zoneRedundant: false
    networkDefaultAction: 'Allow'
    enablePurgeProtection: false
  }
  prod: {
    logRetentionDays: 90
    backendCpu: '1.0'
    backendMemory: '2Gi'
    backendMinReplicas: 2
    backendMaxReplicas: 10
    frontendCpu: '0.5'
    frontendMemory: '1Gi'
    frontendMinReplicas: 2
    frontendMaxReplicas: 10
    zoneRedundant: true
    networkDefaultAction: 'Allow'
    enablePurgeProtection: true
  }
}

var config = environmentConfig[environment]

// Committee code handling
// Lowercase the full list; treat empty or 'all' as "no filtering".
var codesLower = toLower(committeeCodes)
var isAllCommittees = empty(committeeCodes) || codesLower == 'all'
// First code drives resource naming; remaining codes are UI-only.
// Always split a non-empty string so codesList is typed as string[] (never <empty array>).
var codesList = split(isAllCommittees ? '_' : codesLower, ',')
var firstCode = isAllCommittees ? '' : trim(codesList[0])
// Value surfaced to container apps. 'ALL' tells the UI to show every committee.
var committeeCodesEnvValue = isAllCommittees ? 'ALL' : codesLower

// Name infix: environment + first committee code (if any)
// e.g. 'dev', 'dev-itc', 'prod-finance'
var committeeSegment = empty(firstCode) ? '' : '-${firstCode}'
var nameInfix = '${environment}${committeeSegment}'

// Resource naming
// Container Registry: alphanumeric only, 5-50 chars
var registryName = take(replace('${appName}-${nameInfix}-${uniqueSuffix}', '-', ''), 50)

// Key Vault: 3-24 chars max, globally unique
// Format: sd-{env}-[{first-code}-]kv-{suffix}
// e.g. sd-dev-kv-qu7yv (16) | sd-dev-itc-kv-qu7yv (20) | sd-uat-itc-kv-qu7yv (22)
var kvEnvSegment = take(environment, 7)
var kvCodeSegment = empty(firstCode) ? '' : '-${take(firstCode, 3)}'
var keyVaultName = 'sd-${kvEnvSegment}${kvCodeSegment}-kv-${take(uniqueSuffix, 5)}'

var backendAppName = '${appName}-${nameInfix}-backend'
var frontendAppName = '${appName}-${nameInfix}-frontend'

// Placeholder image for first-time deployments (before app images exist in ACR)
var placeholderImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

// Common tags
var commonTags = {
  Environment: environment
  CommitteeCodes: committeeCodes
  Application: appName
  ManagedBy: 'Bicep'
}

// Container Registry
module containerRegistry './modules/container-registry.bicep' = {
  name: 'container-registry-deployment'
  params: {
    location: location
    registryName: registryName
    sku: containerRegistrySku
    adminUserEnabled: false // Use managed identity instead
    publicNetworkAccess: 'Enabled'
    tags: commonTags
  }
}

// Virtual Network — required for VNet-integrated Container Apps Environment and KV private endpoint
module vnet './modules/vnet.bicep' = {
  name: 'vnet-deployment'
  params: {
    location: location
    vnetName: '${appName}-${nameInfix}-vnet'
    tags: commonTags
  }
}

// Container Apps Environment with Log Analytics
module containerAppsEnv './modules/container-apps-env.bicep' = {
  name: 'container-apps-env-deployment'
  params: {
    location: location
    environmentName: '${appName}-${nameInfix}-env'
    logAnalyticsName: '${appName}-${nameInfix}-logs-${uniqueSuffix}'
    logRetentionInDays: config.logRetentionDays
    zoneRedundant: config.zoneRedundant
    infrastructureSubnetId: vnet.outputs.containerAppsSubnetId
    tags: commonTags
  }
}

// Application Insights (connected to Log Analytics)
module appInsights './modules/app-insights.bicep' = {
  name: 'app-insights-deployment'
  params: {
    location: location
    appInsightsName: '${appName}-${nameInfix}-ai-${uniqueSuffix}'
    logAnalyticsId: containerAppsEnv.outputs.logAnalyticsId
    retentionInDays: config.logRetentionDays
    tags: commonTags
  }
}

// Key Vault (deployed early, without dependencies)
module keyVault './modules/key-vault.bicep' = {
  name: 'key-vault-deployment'
  params: {
    location: location
    keyVaultName: keyVaultName
    enableRbacAuthorization: true
    networkDefaultAction: config.networkDefaultAction
    enablePurgeProtection: config.enablePurgeProtection
    publicNetworkAccess: 'Disabled'
    tags: commonTags
  }
}

// Key Vault private endpoint — allows VNet-integrated Container Apps to reach KV on a private IP
module keyVaultPrivateEndpoint './modules/private-endpoint.bicep' = {
  name: 'kv-private-endpoint-deployment'
  params: {
    location: location
    privateEndpointName: '${keyVaultName}-pe'
    subnetId: vnet.outputs.privateEndpointsSubnetId
    keyVaultId: keyVault.outputs.keyVaultId
    vnetId: vnet.outputs.vnetId
    tags: commonTags
  }
}

// Backend Container App
module backendApp './modules/container-app.bicep' = {
  name: 'backend-app-deployment'
  params: {
    location: location
    appName: backendAppName
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: useDefaultImage ? placeholderImage : '${containerRegistry.outputs.loginServer}/${appName}-backend:latest'
    registryServer: containerRegistry.outputs.loginServer
    useManagedIdentityForRegistry: !useDefaultImage
    targetPort: useDefaultImage ? 80 : 3000
    external: true
    minReplicas: config.backendMinReplicas
    maxReplicas: config.backendMaxReplicas
    cpu: config.backendCpu
    memory: config.backendMemory
    enableManagedIdentity: true
    healthProbePath: useDefaultImage ? '/' : '/health'
    tags: commonTags
    // Only wire KV secret references when deploying the real image — the placeholder has no need
    // for Shiftboard credentials and the managed identity role assignment runs after this module.
    additionalSecrets: useDefaultImage ? [] : [
      {
        name: 'shiftboard-access-key'
        keyVaultUrl: '${keyVault.outputs.keyVaultUri}secrets/sb-access-key'
        identity: 'system'
      }
      {
        name: 'shiftboard-secret-key'
        keyVaultUrl: '${keyVault.outputs.keyVaultUri}secrets/sb-signature-key'
        identity: 'system'
      }
    ]
    environmentVariables: concat(
      [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'PORT'
          value: '3000'
        }
        {
          name: 'KEY_VAULT_NAME'
          value: keyVaultName
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.outputs.connectionString
        }
        {
          name: 'COMMITTEE_CODES'
          value: committeeCodesEnvValue
        }
      ],
      useDefaultImage ? [] : [
        {
          name: 'SHIFTBOARD_ACCESS_KEY_ID'
          secretRef: 'shiftboard-access-key'
        }
        {
          name: 'SHIFTBOARD_SECRET_KEY'
          secretRef: 'shiftboard-secret-key'
        }
      ]
    )
  }
}

// Grant backend access to Key Vault secrets
module backendKeyVaultAccess './modules/role-assignment.bicep' = {
  name: 'backend-keyvault-access'
  params: {
    principalId: backendApp.outputs.principalId
    roleDefinitionId: '4633458b-17de-408a-b874-0445c86b69e6' // Key Vault Secrets User
    keyVaultName: keyVaultName
  }
}

// Grant backend access to pull from Container Registry
module backendAcrAccess './modules/role-assignment.bicep' = {
  name: 'backend-acr-access'
  params: {
    principalId: backendApp.outputs.principalId
    roleDefinitionId: '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
    containerRegistryName: registryName
  }
}

// Frontend Container App
module frontendApp './modules/container-app.bicep' = {
  name: 'frontend-app-deployment'
  params: {
    location: location
    appName: frontendAppName
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: useDefaultImage ? placeholderImage : '${containerRegistry.outputs.loginServer}/${appName}-frontend:latest'
    registryServer: containerRegistry.outputs.loginServer
    useManagedIdentityForRegistry: !useDefaultImage
    targetPort: 80
    external: true
    minReplicas: config.frontendMinReplicas
    maxReplicas: config.frontendMaxReplicas
    cpu: config.frontendCpu
    memory: config.frontendMemory
    enableManagedIdentity: true
    healthProbePath: '/'
    tags: commonTags
    environmentVariables: [
      {
        name: 'VITE_API_BASE_URL'
        value: backendApp.outputs.appUrl
      }
      {
        name: 'VITE_COMMITTEE_CODES'
        value: committeeCodesEnvValue
      }
    ]
  }
}

// Grant frontend access to pull from Container Registry
module frontendAcrAccess './modules/role-assignment.bicep' = {
  name: 'frontend-acr-access'
  params: {
    principalId: frontendApp.outputs.principalId
    roleDefinitionId: '7f951dda-4ed3-4680-a7ca-43fe172d538d' // AcrPull
    containerRegistryName: registryName
  }
}

output containerRegistryName string = containerRegistry.outputs.registryName
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output containerRegistryId string = containerRegistry.outputs.registryId
output environmentName string = containerAppsEnv.outputs.environmentName
output backendUrl string = backendApp.outputs.appUrl
output frontendUrl string = frontendApp.outputs.appUrl
output backendFqdn string = backendApp.outputs.fqdn
output frontendFqdn string = frontendApp.outputs.fqdn
output appInsightsConnectionString string = appInsights.outputs.connectionString
output appInsightsInstrumentationKey string = appInsights.outputs.instrumentationKey
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output backendAppName string = backendAppName
output frontendAppName string = frontendAppName
output nameInfix string = nameInfix
output backendPrincipalId string = backendApp.outputs.principalId
output frontendPrincipalId string = frontendApp.outputs.principalId
