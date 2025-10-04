#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AppRunner {
  constructor() {
    this.appsDir = path.join(__dirname, '..', 'apps');
  }

  async run() {
    console.log('🚀 AI App Core - App Runner\n');
    
    try {
      const availableApps = this.getAvailableApps();
      
      if (availableApps.length === 0) {
        console.log('❌ No apps found in apps/ directory');
        console.log('💡 Create an app first with: node cli/create-app.js');
        return;
      }

      console.log('Available apps:');
      availableApps.forEach((app, index) => {
        console.log(`${index + 1}. ${app.name} - ${app.description}`);
      });

      // Auto-select first app for now
      const selectedApp = availableApps[0];
      console.log(`\n🚀 Auto-selecting: ${selectedApp.name}`);
      
      console.log(`\n🚀 Starting ${selectedApp.name}...`);
      console.log(`📁 App directory: ${selectedApp.path}`);
      console.log(`🌐 Backend API: http://localhost:3001`);
      console.log(`\n🚀 Starting backend...`);
      
      // Start backend first
      this.startBackend();
      
      // Then start the app
      this.startApp(selectedApp);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  getAvailableApps() {
    if (!fs.existsSync(this.appsDir)) {
      return [];
    }

    const apps = [];
    const appDirs = fs.readdirSync(this.appsDir);
    
    appDirs.forEach(appDir => {
      const appPath = path.join(this.appsDir, appDir);
      const configPath = path.join(appPath, 'config', 'app.json');
      
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          apps.push({
            name: config.app.name,
            description: config.app.description,
            path: appPath,
            packageName: appDir,
            version: config.app.version
          });
        } catch (error) {
          console.warn(`⚠️  Skipping ${appDir}: Invalid configuration`);
        }
      }
    });
    
    return apps;
  }

  async selectApp(apps) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`\nSelect app to run (1-${apps.length}): `, (answer) => {
        const choice = parseInt(answer) - 1;
        rl.close();
        
        if (choice >= 0 && choice < apps.length) {
          resolve(choice);
        } else {
          console.log('Invalid selection, using first app');
          resolve(0);
        }
      });
    });
  }

  startBackend() {
    const backendPath = path.join(__dirname, '..', '..', 'cut-sprint-backend');
    
    if (fs.existsSync(backendPath)) {
      console.log('🔧 Starting backend server...');
      this.runCommand('npm', ['run', 'dev'], backendPath, true);
    } else {
      console.log('⚠️  Backend not found at:', backendPath);
      console.log('💡 Make sure cut-sprint-backend exists in the parent directory');
    }
  }

  startApp(app) {
    const appPath = app.path;
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(appPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing dependencies...');
      this.runCommand('npm', ['install'], appPath);
    } else {
      console.log('✅ Dependencies already installed');
      console.log('🚀 Starting development server...');
      this.runCommand('npm', ['run', 'dev'], appPath);
    }
  }

  runCommand(command, args, cwd, background = false) {
    const child = spawn(command, args, {
      cwd: cwd,
      stdio: background ? 'pipe' : 'inherit',
      shell: true,
      detached: background
    });

    if (background) {
      child.unref();
    }

    child.on('error', (error) => {
      console.error(`❌ Error running ${command}:`, error.message);
    });

    child.on('close', (code) => {
      if (code !== 0 && !background) {
        console.log(`\n⚠️  Process exited with code ${code}`);
      }
    });

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping app...');
      child.kill('SIGINT');
      process.exit(0);
    });

    return child;
  }
}

// Run the app runner
if (require.main === module) {
  const runner = new AppRunner();
  runner.run().catch(console.error);
}

module.exports = AppRunner;
