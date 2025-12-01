# Flux-Oriented Architecture (FOA)

![Status Checks](https://github.com/yourusername/flux-oriented-architecture/actions/workflows/ci.yml/badge.svg)

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
