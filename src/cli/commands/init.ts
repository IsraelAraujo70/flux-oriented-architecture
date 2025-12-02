import { Command } from 'commander';
import fs from 'fs';
import path from 'path';

export async function initProject() {
  const absolutePath = process.cwd();
  console.log(`Initializing FOA project in ${absolutePath}...`);

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
    },
    devDependencies: {
      'ts-node': '^10.9.2',
      typescript: '^5.3.3'
    }
  };

  if (fs.existsSync(packageJsonPath)) {
    console.log('package.json already exists, updating scripts and dependencies...');
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
      },
      devDependencies: {
        ...(existingPackageJson.devDependencies || {}),
        ...packageJson.devDependencies
      }
    };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

  // Create tsconfig.json
  const tsConfigPath = path.join(absolutePath, 'tsconfig.json');
  if (!fs.existsSync(tsConfigPath)) {
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
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
  }

  // Create foa.config.json
  const foaConfigPath = path.join(absolutePath, 'foa.config.json');
  if (!fs.existsSync(foaConfigPath)) {
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
    fs.writeFileSync(foaConfigPath, JSON.stringify(foaConfig, null, 2));
  }

  // Create example action
  const actionPath = path.join(absolutePath, 'src/actions/hello.ts');
  if (!fs.existsSync(actionPath)) {
    const exampleAction = `
import { FluxContext } from 'flux-oriented-architecture';

export default async function(context: FluxContext) {
  return {
    message: "Hello from FOA!",
    timestamp: new Date()
  };
}
`;
    fs.writeFileSync(actionPath, exampleAction.trim());
  }

  // Create example flux
  const fluxPath = path.join(absolutePath, 'src/flux/hello.json');
  if (!fs.existsSync(fluxPath)) {
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
    fs.writeFileSync(fluxPath, JSON.stringify(exampleFlux, null, 2));
  }

  console.log('Project initialized successfully!');
  console.log('Run "npm install" to install dependencies.');
  console.log('Run "npm run dev" to start the server.');
}

export function registerInitCommand(program: Command) {
  program
    .command('init')
    .description('Initialize a new FOA project in the current directory')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(initProject);
}
