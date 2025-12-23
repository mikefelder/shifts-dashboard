// Azure App Service Infrastructure for HLSR Shiftboard Reporting API
// This Bicep template creates the necessary Azure resources to host the application

// Parameters
@description('The name of the App Service')
param appServiceName string

@description('The name of the App Service Plan')
param appServicePlanName string

@description('The Azure region where resources will be deployed')
param location string = resourceGroup().location

@description('The environment name (dev, staging, prod)')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'prod'

@description('The SKU for the App Service Plan')
@allowed([
  'B1'  // Basic - Development/Test
  'B2'  // Basic - Small production
  'S1'  // Standard - Production
  'S2'  // Standard - Production with more resources
  'P1v2' // Premium v2 - High performance
  'P2v2' // Premium v2 - Higher performance
])
param appServicePlanSku string = 'B1'

@description('Shiftboard Access Key ID (retrieved from Key Vault)')
@secure()
param shiftboardAccessKeyId string

@description('Shiftboard Secret Key (retrieved from Key Vault)')
@secure()
param shiftboardSecretKey string

@description('Enable Application Insights for monitoring')
param enableApplicationInsights bool = true

@description('Tags to apply to resources')
param tags object = {
  Application: 'HLSR Shiftboard Reporting'
  Environment: environment
  ManagedBy: 'Bicep'
}

// Variables
var appInsightsName = '${appServiceName}-insights'
var logAnalyticsWorkspaceName = '${appServiceName}-logs'

// Log Analytics Workspace (for Application Insights)
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = if (enableApplicationInsights) {
  name: logAnalyticsWorkspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights
resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = if (enableApplicationInsights) {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'Node.JS'
    WorkspaceResourceId: enableApplicationInsights ? logAnalyticsWorkspace.id : null
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: appServicePlanSku
  }
  kind: 'linux'
  properties: {
    reserved: true // Required for Linux
  }
}

// App Service
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true // Enforce HTTPS
    clientAffinityEnabled: false // Disable for better scalability
    siteConfig: {
      linuxFxVersion: 'NODE|18-lts' // Node.js 18 LTS
      alwaysOn: appServicePlanSku != 'B1' ? true : false // AlwaysOn not available on B1
      http20Enabled: true
      minTlsVersion: '1.2'
      ftpsState: 'FtpsOnly'
      healthCheckPath: '/api/system/health' // Adjust if you have a health endpoint
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'SHIFTBOARD_ACCESS_KEY_ID'
          value: shiftboardAccessKeyId
        }
        {
          name: 'SHIFTBOARD_SECRET_KEY'
          value: shiftboardSecretKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: enableApplicationInsights ? applicationInsights.properties.ConnectionString : ''
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
      ]
      cors: {
        allowedOrigins: [
          'https://${appServiceName}.azurewebsites.net'
        ]
        supportCredentials: false
      }
    }
  }
}

// Diagnostic Settings for App Service
resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (enableApplicationInsights) {
  name: '${appServiceName}-diagnostics'
  scope: appService
  properties: {
    workspaceId: enableApplicationInsights ? logAnalyticsWorkspace.id : null
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 30
        }
      }
    ]
  }
}

// Outputs
output appServiceHostName string = appService.properties.defaultHostName
output appServicePrincipalId string = appService.identity.principalId
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output applicationInsightsInstrumentationKey string = enableApplicationInsights ? applicationInsights.properties.InstrumentationKey : ''
output applicationInsightsConnectionString string = enableApplicationInsights ? applicationInsights.properties.ConnectionString : ''
