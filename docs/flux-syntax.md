# Flux Syntax Guide

Flux definitions are JSON files that describe how an HTTP request should be processed. Each file defines one endpoint.

## Basic Structure

```json
{
  "endpoint": "/users/:id",
  "method": "GET",
  "description": "Get user details",
  "flow": [
    // ... array of flow nodes
  ]
}
```

## Flow Nodes

### Action Node
Executes a TypeScript function located in `src/actions`.

```json
{
  "type": "action",
  "name": "userData",
  "path": "users/getUser",
  "args": {
    "userId": "${input.id}"
  }
}
```
- **name**: Variable name to store the result in the context.
- **path**: Relative path to the action file (without extension).
- **args**: Arguments passed to the action function. Supports interpolation.

### Condition Node
Executes branches based on a condition.

```json
{
  "type": "condition",
  "if": "${userData.isActive}",
  "then": [
    { "type": "action", ... }
  ],
  "else": [
    { "type": "return", "status": 403, "body": { "error": "Inactive user" } }
  ]
}
```

### ForEach Node
Iterates over an array.

```json
{
  "type": "forEach",
  "items": "${userData.orders}",
  "as": "order",
  "do": [
    {
      "type": "action",
      "name": "processedOrder",
      "path": "orders/process",
      "args": { "orderId": "${order.id}" }
    }
  ]
}
```

### Parallel Node
Executes multiple branches concurrently.

```json
{
  "type": "parallel",
  "branches": [
    [ { "type": "action", "path": "analytics/track" } ],
    [ { "type": "action", "path": "notifications/send" } ]
  ]
}
```

### Try/Catch Node
Handles errors gracefully.

```json
{
  "type": "try",
  "try": [
    { "type": "action", "path": "riskyOperation" }
  ],
  "catch": [
    { "type": "return", "status": 500, "body": { "error": "Operation failed" } }
  ],
  "errorVar": "error"
}
```

### Return Node
Ends the flow and sends a response.

```json
{
  "type": "return",
  "status": 201,
  "body": {
    "success": true,
    "data": "${userData}"
  }
}
```

## Interpolation
Use `${variable}` syntax to access data from the context:
- `${input.body.email}`: Request body
- `${input.query.search}`: Query parameters
- `${input.params.id}`: URL parameters
- `${actionName}`: Result of a previous action
