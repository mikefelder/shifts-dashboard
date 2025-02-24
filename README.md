# hlsr-shiftboard-reporting-api

A Node.js application for interacting with the Shiftboard API.

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

2. Create a `.env` file in the root directory with your Shiftboard API credentials:
```bash
SHIFTBOARD_ACCESS_KEY_ID=your_access_key_id
SHIFTBOARD_SECRET_KEY=your_secret_key
```

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

This will execute the account list query and display the results in JSON format.

## Requirements

- Node.js 14 or higher
- npm or yarn package manager