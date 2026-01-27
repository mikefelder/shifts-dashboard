# Quick Deployment Guide

## Create Deployment Package

Run this PowerShell script to create a deployment ZIP:

```powershell
.\create-deployment-zip.ps1
```

This will:
- Build the React client
- Remove node_modules to reduce size
- Create a timestamped ZIP file ready for Azure

## Upload to Azure App Service

### Option 1: Azure Portal (Easiest)
1. Go to https://portal.azure.com
2. Navigate to your App Service
3. Click **Deployment Center** in the left menu
4. Click **Zip Deploy** or use the upload option
5. Upload the generated `azure-deployment-*.zip` file

### Option 2: Azure CLI
```bash
az webapp deployment source config-zip \
  --resource-group <your-resource-group> \
  --name <your-app-service-name> \
  --src azure-deployment-*.zip
```

## Required Environment Variables

Set these in Azure Portal → App Service → Configuration → Application settings:

| Variable | Description |
|----------|-------------|
| `SHIFTBOARD_ACCESS_KEY_ID` | Your Shiftboard API access key |
| `SHIFTBOARD_SECRET_KEY` | Your Shiftboard API secret key |
| `NODE_ENV` | Set to `production` |
| `PORT` | Usually `8080` (Azure may set this automatically) |

## After Deployment

1. **Monitor Deployment**: Check Deployment Center → Logs
2. **View Application Logs**: App Service → Log stream
3. **Test Application**: Navigate to `https://<your-app-name>.azurewebsites.net`

## Troubleshooting

### App won't start
- Check Log stream for errors
- Verify environment variables are set
- Ensure web.config is in the deployment

### 500 Errors
- Check Application Logs
- Verify all dependencies are in package.json
- Check NODE_ENV=production is set

### Client not loading
- Verify client/dist folder exists in deployment
- Check server logs for static file errors

## File Structure in Deployment

```
azure-deployment-*.zip
├── src/                    (Backend server code)
├── client/
│   ├── dist/              (Built React app - MUST EXIST)
│   ├── src/               (Source files)
│   └── package.json
├── docs/
├── package.json           (Server dependencies)
├── web.config            (Azure/IIS configuration)
├── .deployment           (Deployment settings)
└── deploy.cmd            (Build script for Azure)
```

## Quick Commands

```powershell
# Create deployment package
.\create-deployment-zip.ps1

# Reinstall dependencies locally (if needed)
npm install

# Build client locally (if needed)
npm run build

# Test locally before deploying
npm start
# Then visit http://localhost:3000
```

## Notes

- The deployment ZIP does NOT include node_modules (Azure installs them)
- The deployment ZIP DOES include the built client (client/dist)
- Environment variables should NEVER be in the ZIP (set in Azure Portal)
- Azure will automatically run the deploy.cmd script during deployment
