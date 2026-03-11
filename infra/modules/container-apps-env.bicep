@description('Location for all resources')
param location string = resourceGroup().location

@description('Container Apps Environment name')
param environmentName string

@description('Log Analytics Workspace name')
param logAnalyticsName string

@description('Log Analytics retention in days')
param logRetentionInDays int = 30

@description('Enable zone redundancy')
param zoneRedundant bool = false

@description('Optional: ID of the dedicated infrastructure subnet (must be /21 minimum, delegated to Microsoft.App/environments). When provided, the environment is VNet-integrated. Cannot be changed after environment creation.')
param infrastructureSubnetId string = ''

@description('Resource tags')
param tags object = {}

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: logRetentionInDays
  }
}

resource containerAppsEnvironment 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: environmentName
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
    zoneRedundant: zoneRedundant
    vnetConfiguration: empty(infrastructureSubnetId) ? null : {
      infrastructureSubnetId: infrastructureSubnetId
    }
  }
}

output environmentId string = containerAppsEnvironment.id
output environmentName string = containerAppsEnvironment.name
output logAnalyticsId string = logAnalytics.id
