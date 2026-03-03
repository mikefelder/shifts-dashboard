targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Application name')
param appName string = 'shift-dashboard'

@description('Unique suffix for resource names')
param uniqueSuffix string = uniqueString(resourceGroup().id)

@description('SKU for the Azure Container Registry. Defaults to Basic; override to Standard in deployment pipelines when needed.')
@allowed(['Basic', 'Standard', 'Premium'])
param containerRegistrySku string = 'Basic'

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
  }
  staging: {
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
  }
}

var config = environmentConfig[environment]

// Resource naming
var registryName = replace('${appName}${uniqueSuffix}', '-', '')
var keyVaultName = '${appName}-kv-${uniqueSuffix}'
var backendAppName = '${appName}-backend-${environment}'
var frontendAppName = '${appName}-frontend-${environment}'

// Common tags
var commonTags = {
  Environment: environment
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

// Container Apps Environment with Log Analytics
module containerAppsEnv './modules/container-apps-env.bicep' = {
  name: 'container-apps-env-deployment'
  params: {
    location: location
    environmentName: '${appName}-env-${environment}'
    logAnalyticsName: '${appName}-logs-${uniqueSuffix}'
    logRetentionInDays: config.logRetentionDays
    zoneRedundant: config.zoneRedundant
    tags: commonTags
  }
}

// Application Insights (connected to Log Analytics)
module appInsights './modules/app-insights.bicep' = {
  name: 'app-insights-deployment'
  params: {
    location: location
    appInsightsName: '${appName}-ai-${uniqueSuffix}'
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
    containerImage: '${containerRegistry.outputs.loginServer}/${appName}-backend:latest'
    registryServer: containerRegistry.outputs.loginServer
    useManagedIdentityForRegistry: true
    targetPort: 3000
    external: true
    minReplicas: config.backendMinReplicas
    maxReplicas: config.backendMaxReplicas
    cpu: config.backendCpu
    memory: config.backendMemory
    enableManagedIdentity: true
    healthProbePath: '/health'
    tags: commonTags
    environmentVariables: [
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
    ]
  }
  dependsOn: [
    keyVault
  ]
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
    containerImage: '${containerRegistry.outputs.loginServer}/${appName}-frontend:latest'
    registryServer: containerRegistry.outputs.loginServer
    useManagedIdentityForRegistry: true
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
        name: 'VITE_API_URL'
        value: backendApp.outputs.appUrl
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
output backendAppName string = backendApp.outputs.appName
output frontendAppName string = frontendApp.outputs.appName
output backendPrincipalId string = backendApp.outputs.principalId
output frontendPrincipalId string = frontendApp.outputs.principalId
