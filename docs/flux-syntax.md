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

## Required Fields

- **endpoint**: The URL path (supports Express-style parameters like `:id`)
- **method**: HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- **flow**: Array of flow nodes to execute sequentially

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
- `${input.email}`: Merged input (body + query + params)
- `${input.body.email}`: Request body (deprecated, use `${input.email}`)
- `${input.query.search}`: Query parameters (deprecated, use `${input.search}`)
- `${input.params.id}`: URL parameters (deprecated, use `${input.id}`)
- `${actionName}`: Result of a previous action
- `${actionName.property}`: Nested property access

### Interpolation in Objects

Interpolation works recursively in objects and arrays:

```json
{
  "type": "return",
  "status": 200,
  "body": {
    "success": true,
    "user": "${userData}",
    "orders": "${userOrders}",
    "message": "Welcome ${userData.name}!"
  }
}
```

### Full Expression vs String Interpolation

```json
// Full expression - returns the actual value/object
"${userData}"  // Returns: { id: 1, name: "John" }

// String interpolation - converts to string
"User: ${userData.name}"  // Returns: "User: John"
```

## Using Plugins in Actions

Plugins are automatically injected into the context and can be accessed in your actions:

```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function createUser(ctx: FluxContext) {
  const { name, email } = ctx.input;
  
  // Access database plugin
  const result = await ctx.plugins.db.query(
    'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
    [name, email]
  );
  
  return result.rows[0];
}
```

### Available Plugin Methods

**Database (PostgreSQL):**
- `ctx.plugins.db.query(sql, params)`: Execute a query
- `ctx.plugins.db.pool`: Access the connection pool

**Cache (Redis - Coming Soon):**
- `ctx.plugins.cache.get(key)`: Get cached value
- `ctx.plugins.cache.set(key, value, ttl)`: Set cached value
- `ctx.plugins.cache.del(key)`: Delete cached value

**Auth (JWT - Coming Soon):**
- `ctx.plugins.auth.sign(payload)`: Generate JWT token
- `ctx.plugins.auth.verify(token)`: Verify JWT token

**Email (Coming Soon):**
- `ctx.plugins.email.send(options)`: Send email

## Environment Variables

FOA supports environment variables in `foa.config.json` using `${VAR_NAME}` syntax:

```json
{
  "server": {
    "port": 3000
  },
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}"
    }
  }
}
```

Create a `.env` file in your project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
PORT=3000
```

The framework automatically loads `.env` and replaces placeholders.

## Complete Example

**Flux Definition (`src/flux/create-product.json`):**

```json
{
  "endpoint": "/products",
  "method": "POST",
  "description": "Create a new product",
  "flow": [
    {
      "type": "action",
      "name": "newProduct",
      "path": "product/createProduct"
    },
    {
      "type": "return",
      "status": 201,
      "body": {
        "success": true,
        "data": "${newProduct}"
      }
    }
  ]
}
```

**Action (`src/actions/product/createProduct.ts`):**

```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function createProduct(ctx: FluxContext) {
  const { name, price, description } = ctx.input;
  
  if (!name || !price) {
    throw new Error('Name and price are required');
  }

  const query = `
    INSERT INTO products (name, price, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  const result = await ctx.plugins.db.query(query, [name, price, description]);
  return result.rows[0];
}
```

**Request:**

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop",
    "price": 1299.99,
    "description": "High-performance laptop"
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Laptop",
    "price": "1299.99",
    "description": "High-performance laptop",
    "created_at": "2024-12-02T10:00:00.000Z"
  }
}
```

## Best Practices

1. **Keep Actions Small**: Each action should do one thing well
2. **Use Descriptive Names**: Action names in flux should clearly indicate what they do
3. **Handle Errors**: Use try/catch nodes for operations that might fail
4. **Validate Input**: Check required fields in actions and throw meaningful errors
5. **Return Consistent Shapes**: Return objects with consistent structure across similar actions
6. **Use Environment Variables**: Never hardcode sensitive data in config files
