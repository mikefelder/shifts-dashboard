@description('Location for all resources')
param location string = resourceGroup().location

@description('Container App name')
param appName string

@description('Container Apps Environment ID')
param environmentId string

@description('Container image')
param containerImage string

@description('Container Registry login server')
param registryServer string

@description('Container Registry username (optional if using managed identity)')
@secure()
param registryUsername string = ''

@description('Container Registry password (optional if using managed identity)')
@secure()
param registryPassword string = ''

@description('Use managed identity for registry authentication')
param useManagedIdentityForRegistry bool = false

@description('Environment variables')
param environmentVariables array = []

@description('CPU cores')
param cpu string = '0.5'

@description('Memory size')
param memory string = '1Gi'

@description('Min replicas')
param minReplicas int = 0

@description('Max replicas')
param maxReplicas int = 3

@description('Target port')
param targetPort int = 3000

@description('External ingress enabled')
param external bool = true

@description('Enable managed identity')
param enableManagedIdentity bool = false

@description('Health probe path')
param healthProbePath string = '/health'

@description('Resource tags')
param tags object = {}

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  location: location
  tags: tags
  identity: enableManagedIdentity ? {
    type: 'SystemAssigned'
  } : null
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: external
        targetPort: targetPort
        allowInsecure: false
        traffic: [
          {
            latestRevision: true
            weight: 100
          }
        ]
      }
      registries: useManagedIdentityForRegistry ? [
        {
          server: registryServer
          identity: 'system'
        }
      ] : [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: useManagedIdentityForRegistry ? [] : [
        {
          name: 'registry-password'
          value: registryPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: appName
          image: containerImage
          resources: {
            cpu: json(cpu)
            memory: memory
          }
          env: environmentVariables
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: healthProbePath
                port: targetPort
                scheme: 'HTTP'
              }
              initialDelaySeconds: 10
              periodSeconds: 10
              failureThreshold: 3
              timeoutSeconds: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: healthProbePath
                port: targetPort
                scheme: 'HTTP'
              }
              initialDelaySeconds: 5
              periodSeconds: 5
              failureThreshold: 3
              timeoutSeconds: 3
            }
            {
              type: 'Startup'
              httpGet: {
                path: healthProbePath
                port: targetPort
                scheme: 'HTTP'
              }
              initialDelaySeconds: 0
              periodSeconds: 3
              failureThreshold: 30
              timeoutSeconds: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '10'
              }
            }
          }
          {
            name: 'cpu-rule'
            custom: {
              type: 'cpu'
              metadata: {
                type: 'Utilization'
                value: '70'
              }
            }
          }
          {
            name: 'memory-rule'
            custom: {
              type: 'memory'
              metadata: {
                type: 'Utilization'
                value: '80'
              }
            }
          }
        ]
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output appId string = containerApp.id
output appName string = containerApp.name
output principalId string = enableManagedIdentity ? containerApp.identity.principalId : ''
