#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectDir = process.argv[2] || '.';
const absolutePath = path.resolve(process.cwd(), projectDir);

console.log(`Creating FOA app in ${absolutePath}...`);

// Create directories
const dirs = [
  'src/actions',
  'src/flux'
];

dirs.forEach(dir => {
  const fullPath = path.join(absolutePath, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Copy templates
// Note: In a real package, templates should be copied from dist/cli/templates or similar
// We will create them inline for simplicity here, or read from the package structure if we knew where dist was relative to this script.
// Since this is bin/create-foa-app.js, and package structure is:
// root/
//   bin/
//   dist/
//     cli/
//       templates/

const templateDir = path.join(__dirname, '../dist/cli/templates');

function copyTemplate(templateName, targetPath) {
  try {
    const content = fs.readFileSync(path.join(templateDir, templateName), 'utf-8');
    fs.writeFileSync(path.join(absolutePath, targetPath), content);
  } catch (e) {
    console.warn(`Could not copy template ${templateName}: ${e.message}`);
    // Fallback to writing default content if template file missing in dev
  }
}

// We'll just write default content directly to be safe
const packageJson = {
  name: path.basename(absolutePath),
  version: "1.0.0",
  scripts: {
    "dev": "foa dev",
    "start": "foa start"
  },
  dependencies: {
    "flux-oriented-architecture": "latest" 
  }
};

fs.writeFileSync(path.join(absolutePath, 'package.json'), JSON.stringify(packageJson, null, 2));

const tsConfig = {
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
};

fs.writeFileSync(path.join(absolutePath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

const foaConfig = {
  "server": {
    "port": 3000
  },
  "paths": {
    "actions": "src/actions",
    "flux": "src/flux"
  },
  "logging": {
    "level": "info"
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
  "endpoint": "/hello",
  "method": "GET",
  "description": "Example endpoint",
  "flow": [
    {
      "type": "action",
      "name": "result",
      "path": "hello"
    },
    {
      "type": "return",
      "body": "${result}"
    }
  ]
};
fs.writeFileSync(path.join(absolutePath, 'src/flux/hello.json'), JSON.stringify(exampleFlux, null, 2));

console.log('Installing dependencies...');
try {
  execSync('npm install', { cwd: absolutePath, stdio: 'inherit' });
} catch (e) {
  console.warn('npm install failed, please run it manually.');
}

console.log('\nDone! To start your server:');
console.log(`cd ${projectDir}`);
console.log('npm run dev');
