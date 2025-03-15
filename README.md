# HLSR Shiftboard Reporting API

Web application for viewing and managing HLSR Information Technology Committee shifts.

## Features

- Real-time shift calendar view
- Clock-in status tracking
- Workgroup (committee) filtering
- Responsive design for desktop/mobile

## QuickStart Guide
   If you don't have node and npm installed, please follow the detailed instructions for you platform.

   Assuming you have node installed on your machine, in both the `root` and `client` folders run the following:
   ```bash
   npm install
   ```
   then
   ```bash
   npm run dev
   ```

## Installing Node.js and npm

### Windows
1. Download the Windows installer from the [Node.js website](https://nodejs.org/)
2. Run the installer (the .msi file you downloaded)
3. Follow the prompts in the installer
4. Restart your computer
5. Verify installation by opening Command Prompt and typing:
   ```bash
   node --version
   npm --version
   ```

### Mac
1. Using Homebrew (recommended):
   ```bash
   brew install node
   ```
   
   If you don't have Homebrew installed, install it first:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. Verify installation:
   ```bash
   node --version
   npm --version
   ```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with Shiftboard credentials:
```
SHIFTBOARD_ACCESS_KEY_ID=your_key
SHIFTBOARD_SECRET_KEY=your_secret
```

3. Start development server:
```bash
npm run dev
```

## API Endpoints

### GET /api/shifts/whos-on

Returns all active shifts from Shiftboard with the following enhancements:
- Fetches all pages automatically (no pagination needed)
- Groups shifts with multiple members into single shift records
- Includes clock-in status for each person
- Performance metrics for large datasets

## Tech Stack

- React + TypeScript
- Material-UI
- Node.js + Express
- Shiftboard API Integration

## Project Structure

```
src/
  ├── config/        # Configuration files
  ├── services/      # Business logic and API services
  ├── utils/         # Utility functions
  └── index.js       # Application entry point
```

## Running the Application

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
# or
npm run prod
```

## Requirements

- Node.js 14 or higher
- npm or yarn package manager