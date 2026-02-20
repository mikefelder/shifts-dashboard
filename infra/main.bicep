targetScope = 'resourceGroup'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'dev'

@description('Application name')
param appName string = 'shifts-dashboard'

@description('Unique suffix for resource names')
param uniqueSuffix string = uniqueString(resourceGroup().id)

// Computed values
var registryName = '${appName}${uniqueSuffix}'

// Container Registry
module containerRegistry './modules/container-registry.bicep' = {
  name: 'container-registry-deployment'
  params: {
    location: location
    registryName: registryName
    sku: 'Basic'
    adminUserEnabled: true
  }
}

// Container Apps Environment with Log Analytics
module containerAppsEnv './modules/container-apps-env.bicep' = {
  name: 'container-apps-env-deployment'
  params: {
    location: location
    environmentName: '${appName}-env-${environment}'
    logAnalyticsName: '${appName}-logs-${uniqueSuffix}'
  }
}

// Backend Container App
module backendApp './modules/container-app.bicep' = {
  name: 'backend-app-deployment'
  params: {
    location: location
    appName: '${appName}-backend-${environment}'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${containerRegistry.outputs.loginServer}/${appName}-backend:latest'
    registryServer: containerRegistry.outputs.loginServer
    registryUsername: registryName
    registryPassword: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', registryName), '2023-07-01').passwords[0].value
    targetPort: 3000
    external: true
    minReplicas: 0
    maxReplicas: 3
    cpu: '0.5'
    memory: '1Gi'
    environmentVariables: [
      {
        name: 'NODE_ENV'
        value: 'production'
      }
      {
        name: 'PORT'
        value: '3000'
      }
    ]
  }
}

// Frontend Container App
module frontendApp './modules/container-app.bicep' = {
  name: 'frontend-app-deployment'
  params: {
    location: location
    appName: '${appName}-frontend-${environment}'
    environmentId: containerAppsEnv.outputs.environmentId
    containerImage: '${containerRegistry.outputs.loginServer}/${appName}-frontend:latest'
    registryServer: containerRegistry.outputs.loginServer
    registryUsername: registryName
    registryPassword: listCredentials(resourceId('Microsoft.ContainerRegistry/registries', registryName), '2023-07-01').passwords[0].value
    targetPort: 80
    external: true
    minReplicas: 0
    maxReplicas: 3
    cpu: '0.25'
    memory: '0.5Gi'
    environmentVariables: []
  }
}

output containerRegistryName string = containerRegistry.outputs.registryName
output containerRegistryLoginServer string = containerRegistry.outputs.loginServer
output environmentName string = containerAppsEnv.outputs.environmentName
output backendUrl string = backendApp.outputs.appUrl
output frontendUrl string = frontendApp.outputs.appUrl
output backendFqdn string = backendApp.outputs.fqdn
output frontendFqdn string = frontendApp.outputs.fqdn
