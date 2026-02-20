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

@description('Container Registry username')
@secure()
param registryUsername string

@description('Container Registry password')
@secure()
param registryPassword string

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

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  location: location
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
      registries: [
        {
          server: registryServer
          username: registryUsername
          passwordSecretRef: 'registry-password'
        }
      ]
      secrets: [
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
        ]
      }
    }
  }
}

output fqdn string = containerApp.properties.configuration.ingress.fqdn
output appUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output appId string = containerApp.id
