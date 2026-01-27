# Azure App Service Deployment Guide

## Prerequisites

1. An Azure account with an active subscription
2. Node.js 14 or higher installed locally
3. This codebase ready to build

## Building for Production

Before creating the deployment package, build the application locally:

```powershell
# Install dependencies and build the client
npm install
npm run build
```

This will:
- Install server dependencies
- Install client dependencies
- Build the React frontend to `client/dist/`

## Creating the Deployment Package

### Option 1: Create ZIP directly (Recommended)

Create a ZIP file containing all necessary files EXCEPT:
- `node_modules/` folders (Azure will install these)
- `.git/` folder
- `.env` files (configure these in Azure)
- Development files

**Using PowerShell:**

```powershell
# Create a zip excluding unnecessary files
$exclude = @('node_modules', '.git', '.env*', '*.log', '.vscode', 'client/node_modules')
$files = Get-ChildItem -Recurse | Where-Object { 
    $item = $_
    -not ($exclude | Where-Object { $item.FullName -like "*$_*" })
}
Compress-Archive -Path * -DestinationPath deployment.zip -Force
```

**Simpler approach - ZIP everything except node_modules:**

1. Delete `node_modules` folders:
   ```powershell
   Remove-Item -Path .\node_modules -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item -Path .\client\node_modules -Recurse -Force -ErrorAction SilentlyContinue
   ```

2. Create the ZIP:
   - Right-click the project folder
   - Select "Compress to ZIP file" or use:
   ```powershell
   Compress-Archive -Path * -DestinationPath ..\hlsr-shiftboard-app.zip
   ```

### Option 2: Deploy from Git

Azure can also deploy directly from your Git repository, which handles the build automatically.

## Azure App Service Setup

### 1. Create App Service

1. Log into [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Web App"
3. Configure:
   - **Resource Group**: Create new or select existing
   - **Name**: Choose a unique name (e.g., `hlsr-shiftboard-api`)
   - **Runtime stack**: Node 18 LTS or higher
   - **Operating System**: Linux (recommended) or Windows
   - **Region**: Choose nearest region
   - **Pricing Plan**: Select appropriate tier (B1 or higher recommended)

### 2. Configure Environment Variables

After creating the App Service:

1. Go to your App Service → **Configuration** → **Application Settings**
2. Add the following environment variables:

```
SHIFTBOARD_ACCESS_KEY_ID=<your_access_key>
SHIFTBOARD_SECRET_KEY=<your_secret_key>
NODE_ENV=production
PORT=8080
```

3. Click **Save**

### 3. Deploy the ZIP File

#### Method A: Using Azure Portal

1. Go to your App Service
2. In the left menu, select **Deployment Center**
3. Choose **Zip Deploy** or **Local Git**
4. If using Zip Deploy:
   - Upload your `hlsr-shiftboard-app.zip`
   - Azure will automatically extract and deploy

#### Method B: Using Azure CLI

```powershell
# Install Azure CLI if not already installed
# https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

# Login to Azure
az login

# Deploy the ZIP
az webapp deployment source config-zip `
  --resource-group <your-resource-group> `
  --name <your-app-name> `
  --src hlsr-shiftboard-app.zip
```

#### Method C: Using FTP/FTPS

1. Go to App Service → **Deployment Center** → **FTPS credentials**
2. Copy FTP hostname and credentials
3. Use an FTP client (FileZilla, WinSCP) to upload files to `/site/wwwroot`

### 4. Verify Deployment

1. Check deployment logs:
   - App Service → **Deployment Center** → View deployment logs
   
2. Check application logs:
   - App Service → **Log stream**

3. Test the application:
   - Navigate to `https://<your-app-name>.azurewebsites.net`

## Post-Deployment Configuration

### Enable Logging

1. Go to App Service → **App Service logs**
2. Enable:
   - Application Logging (Filesystem)
   - Web server logging
   - Detailed error messages

### Set Startup Command (if needed)

If the app doesn't start automatically:

1. Go to App Service → **Configuration** → **General settings**
2. Set **Startup Command**: `node src/index.js`
3. Save and restart

### Configure CORS (if needed)

If you need to allow specific origins:

1. Update `src/index.js` CORS configuration
2. Or set in Azure Portal:
   - App Service → **CORS**
   - Add allowed origins

## Troubleshooting

### Application won't start

1. Check logs in **Log stream**
2. Verify environment variables are set correctly
3. Ensure Node.js version matches your local development version
4. Check that `web.config` is present in the root

### 500 Errors

1. Check **Application Logs** for errors
2. Verify all dependencies are listed in `package.json`
3. Check that `NODE_ENV=production` is set

### Static files not serving

1. Verify the client was built: check if `client/dist/` exists in deployment
2. Check server logs for path errors
3. Verify `src/index.js` static file middleware configuration

## File Structure in Deployment

Your deployment should include:
```
/
├── src/                    # Server source code
├── client/                 # Client source and build
│   ├── dist/              # Built React app (created by build)
│   ├── src/               # Client source files
│   └── package.json       # Client dependencies
├── docs/                  # Documentation
├── package.json           # Server dependencies
├── web.config            # IIS/iisnode configuration
├── .deployment           # Azure deployment config
├── deploy.cmd            # Custom deployment script
└── .env                  # NOT INCLUDED - set in Azure Portal
```

## Updating the Application

To deploy updates:

1. Make your code changes locally
2. Test locally
3. Build the client: `npm run build`
4. Create a new ZIP file
5. Deploy using one of the methods above
6. Azure will automatically restart the application

## Security Checklist

- [ ] Environment variables configured in Azure (not in code)
- [ ] `.env` file NOT included in deployment
- [ ] CORS configured for production URLs only
- [ ] HTTPS enforced (Azure does this by default)
- [ ] Application Insights enabled (optional, for monitoring)
- [ ] Regular security updates applied

## Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Node.js on Azure](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Deploy ZIP file](https://docs.microsoft.com/en-us/azure/app-service/deploy-zip)
