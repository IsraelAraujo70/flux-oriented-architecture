# Getting Started

Flux-Oriented Architecture (FOA) is a framework designed to orchestrate backend logic using declarative flow definitions.

## Installation

```bash
npm install flux-oriented-architecture
```

## Creating a New Project

Use the scaffold tool to quickly set up a new project:

```bash
npx create-foa-app my-api
cd my-api
npm run dev
```

This will create a basic project structure with:
- `src/actions/`: Where your TypeScript business logic resides.
- `src/flux/`: Where you define your API endpoints and their execution flow.
- `foa.config.json`: Configuration file.

## Project Structure

```
my-api/
├── src/
│   ├── actions/
│   │   └── hello.ts      # Action function
│   └── flux/
│       └── hello.json    # Flow definition
├── foa.config.json
├── package.json
└── tsconfig.json
```

## Running the Server

- **Development**: `foa dev` (or `npm run dev`) - Starts the server with hot-reload enabled.
- **Production**: `foa start` (or `npm run start`) - Starts the optimized server.
- **Validation**: `foa validate` - Checks all your flux JSON files for syntax errors.
- **Listing**: `foa list` - Displays all registered endpoints.
