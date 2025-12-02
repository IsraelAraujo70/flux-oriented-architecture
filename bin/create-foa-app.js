#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check for arguments
if (process.argv.length > 2) {
  console.error('\x1b[31mError: Arguments are no longer supported.\x1b[0m');
  console.error(
    'Please create a directory, cd into it, and run "create-foa-app" (or "npx create-foa-app").'
  );
  console.error('\nExample:');
  console.error('  mkdir my-api');
  console.error('  cd my-api');
  console.error('  npx create-foa-app');
  process.exit(1);
}

const absolutePath = process.cwd();

console.log(`Creating FOA app in ${absolutePath}...`);

// Create directories
const dirs = ['src/actions', 'src/flux'];

dirs.forEach((dir) => {
  const fullPath = path.join(absolutePath, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Create package.json
const packageJsonPath = path.join(absolutePath, 'package.json');
let packageJson = {
  name: path.basename(absolutePath),
  version: '1.0.0',
  scripts: {
    dev: 'foa dev',
    start: 'foa start',
    validate: 'foa validate',
    list: 'foa list'
  },
  dependencies: {
    'flux-oriented-architecture': 'latest'
  }
};

if (fs.existsSync(packageJsonPath)) {
  console.log('package.json already exists, updating scripts and dependencies...');
  try {
    const existingPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    packageJson = {
      ...existingPackageJson,
      scripts: {
        ...(existingPackageJson.scripts || {}),
        ...packageJson.scripts
      },
      dependencies: {
        ...(existingPackageJson.dependencies || {}),
        ...packageJson.dependencies
      }
    };
  } catch (e) {
    console.warn('Could not parse existing package.json, skipping update.');
  }
}

fs.writeFileSync(path.join(absolutePath, 'package.json'), JSON.stringify(packageJson, null, 2));

const tsConfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'commonjs',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  }
};

fs.writeFileSync(path.join(absolutePath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

const foaConfig = {
  server: {
    port: 3000
  },
  paths: {
    actions: 'src/actions',
    flux: 'src/flux'
  },
  logging: {
    level: 'info'
  }
};

fs.writeFileSync(path.join(absolutePath, 'foa.config.json'), JSON.stringify(foaConfig, null, 2));

// Create example action
const exampleAction = `
import { FluxContext } from 'flux-oriented-architecture';

export default async function(context: FluxContext) {
  return {
    message: "Hello from FOA!",
    timestamp: new Date()
  };
}
`;
fs.writeFileSync(path.join(absolutePath, 'src/actions/hello.ts'), exampleAction.trim());

// Create example flux
const exampleFlux = {
  endpoint: '/hello',
  method: 'GET',
  description: 'Example endpoint',
  flow: [
    {
      type: 'action',
      name: 'result',
      path: 'hello'
    },
    {
      type: 'return',
      body: '${result}'
    }
  ]
};
fs.writeFileSync(
  path.join(absolutePath, 'src/flux/hello.json'),
  JSON.stringify(exampleFlux, null, 2)
);

console.log('Installing dependencies...');
try {
  execSync('npm install', { cwd: absolutePath, stdio: 'inherit' });
} catch (e) {
  console.warn('npm install failed, please run it manually.');
}

console.log('\nDone! To start your server:');
console.log('npm run dev');
