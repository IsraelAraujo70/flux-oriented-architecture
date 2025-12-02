# Flux-Oriented Architecture (FOA)

![Status Checks](https://github.com/IsraelAraujo70/flux-oriented-architecture/actions/workflows/ci.yml/badge.svg)

Backend framework with declarative flow orchestration.

## Installation

```bash
npm install flux-oriented-architecture
```

## Quick Start

```bash
npx create-foa-app my-api
cd my-api
npm run dev
```

## CLI Commands

- `foa dev` – start dev server with hot reload
- `foa start` – start server (prod mode)
- `foa validate` – validate all flux JSON definitions
- `foa list` – list registered endpoints (method + path)
- `foa visualize <flux>` – start a local viewer (defaults to http://127.0.0.1:6969) for a flux JSON file

## Visualizing a Flux Definition

Run a small viewer for any flux JSON:

```bash
foa visualize src/flux/hello.json --port 6969 --host 127.0.0.1
# or by name (relative to configured flux path):
foa visualize hello
```

Open the printed URL to explore the JSON structure, copy it, and see validation errors (if any).

## Flux Definition Example

```json
{
  "endpoint": "/users",
  "method": "POST",
  "flow": [
    {
      "type": "action",
      "name": "user",
      "path": "users/create",
      "args": {
        "email": "${input.email}",
        "password": "${input.password}"
      }
    },
    {
      "type": "return",
      "status": 201,
      "body": {
        "id": "${user.id}",
        "message": "User created"
      }
    }
  ]
}
```

## License

MIT
