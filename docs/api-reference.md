# API Reference

Complete API reference for Flux-Oriented Architecture framework.

## Core Classes

### FluxServer

Main server class for running FOA applications.

```typescript
import { FluxServer } from 'flux-oriented-architecture';

const server = new FluxServer('foa.config.json');
await server.init();
await server.start({ port: 3000 });
```

**Methods:**
- `init()`: Initialize server, load config, plugins, and actions
- `start(options?)`: Start the HTTP server
- `reload()`: Reload actions and flux definitions (dev mode)

### FluxContext

The context object passed to every action function.

```typescript
export interface FluxContext {
  req: Request;           // Express request object
  res: Response;          // Express response object
  input: any;             // Merged body, query, and params
  results: Record<string, any>; // Results of all executed actions
  state: Record<string, any>;   // Shared state for the request
  args?: Record<string, any>;   // Arguments specific to the current action
  plugins: Record<string, any>; // Injected plugins
  [key: string]: any;     // Dynamic properties
}
```

**Example:**
```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function myAction(ctx: FluxContext) {
  const { name } = ctx.input;
  const user = ctx.userData; // Result from previous action
  
  // Access plugin
  const result = await ctx.plugins.db.query('SELECT * FROM users WHERE name = $1', [name]);
  
  return result.rows;
}
```

### Environment

Environment variables management.

```typescript
import { getEnvironment } from 'flux-oriented-architecture';

const env = getEnvironment();

// Load .env file
env.load();

// Get variable
const dbUrl = env.get('DATABASE_URL');

// Get with default
const port = env.get('PORT', '3000');

// Check if exists
if (env.has('REDIS_URL')) {
  // Redis is configured
}

// Interpolate string
const message = env.interpolate('Server on ${HOST}:${PORT}');

// Interpolate object
const config = env.interpolateObject({
  database: '${DATABASE_URL}',
  port: '${PORT}'
});
```

## Utilities

### Validation

```typescript
import { 
  validate, 
  validateOrThrow, 
  ValidationException,
  type ValidationSchema 
} from 'flux-oriented-architecture';

// Define schema
const schema: ValidationSchema = {
  email: {
    required: true,
    type: 'email'
  },
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50
  },
  age: {
    type: 'number',
    min: 18,
    max: 120
  },
  website: {
    type: 'url'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[A-Z])(?=.*[0-9])/,
    custom: (value) => {
      if (!value.includes('!')) {
        return 'Password must contain at least one special character';
      }
      return true;
    }
  }
};

// Validate data
const errors = validate(data, schema);

if (errors.length > 0) {
  // Handle errors
  console.log(errors);
}

// Or throw if invalid
try {
  validateOrThrow(data, schema);
} catch (e) {
  if (e instanceof ValidationException) {
    // e.errors contains all validation errors
    // e.statusCode is 400
  }
}
```

**Individual validators:**
```typescript
import { 
  validateRequired,
  validateEmail,
  validateEmailField,
  validateLength,
  validateRange,
  validateUrl,
  sanitizeString,
  sanitizeObject
} from 'flux-oriented-architecture';

// Required fields
const errors = validateRequired(data, ['name', 'email']);

// Email validation
if (validateEmail('user@example.com')) {
  // Valid
}

// String length
const result = validateLength('password', 8, 32);
if (!result.valid) {
  console.log(result.message);
}

// Numeric range
const rangeResult = validateRange(25, 18, 65);

// URL validation
if (validateUrl('https://example.com')) {
  // Valid
}

// Sanitize
const clean = sanitizeString('<script>alert("xss")</script>');
const cleanObj = sanitizeObject({ name: 'John', age: null, city: undefined });
```

### Response Helpers

```typescript
import {
  success,
  error,
  paginated,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  validationError,
  internalError,
  HttpStatus
} from 'flux-oriented-architecture';

// Success response
return success({ id: 1, name: 'John' }, 'User created successfully');
// Returns: { success: true, data: {...}, message: '...' }

// Error response
return error('Something went wrong', { details: 'More info' }, 'ERROR_CODE');
// Returns: { success: false, error: '...', details: {...}, code: '...' }

// Paginated response
const users = await db.query('SELECT * FROM users LIMIT 10 OFFSET 0');
const total = await db.query('SELECT COUNT(*) FROM users');
return paginated(users, 1, 10, total);
// Returns: { success: true, data: [...], pagination: {...} }

// Common errors
return notFound('User');
return badRequest('Invalid input');
return unauthorized();
return forbidden();
return conflict('Email already exists');
return validationError([{ field: 'email', message: 'Invalid email' }]);
return internalError();

// Custom status
return { status: HttpStatus.CREATED, body: success(data) };
```

### Helper Functions

```typescript
import {
  sleep,
  retry,
  pick,
  omit,
  deepClone,
  flatten,
  randomString,
  uuid,
  slugify,
  capitalize,
  toSnakeCase,
  toCamelCase,
  debounce,
  throttle,
  groupBy,
  chunk,
  unique,
  uniqueBy,
  isEmpty,
  formatBytes,
  formatDuration,
  parsePagination
} from 'flux-oriented-architecture';

// Async utilities
await sleep(1000); // Sleep for 1 second

const result = await retry(
  async () => await fetchData(),
  { maxAttempts: 3, initialDelay: 1000 }
);

// Object utilities
const picked = pick(user, ['id', 'name', 'email']);
const without = omit(user, ['password', 'token']);
const cloned = deepClone(complexObject);
const flat = flatten({ user: { name: 'John', age: 30 } });
// Returns: { 'user.name': 'John', 'user.age': 30 }

// String utilities
const id = uuid(); // '550e8400-e29b-41d4-a716-446655440000'
const random = randomString(16, 'alphanumeric');
const slug = slugify('Hello World!'); // 'hello-world'
const title = capitalize('hello'); // 'Hello'
const snake = toSnakeCase('userName'); // 'user_name'
const camel = toCamelCase('user_name'); // 'userName'

// Function utilities
const debouncedFn = debounce(expensiveFunction, 300);
const throttledFn = throttle(apiCall, 1000);

// Array utilities
const grouped = groupBy(users, 'role');
// Returns: { admin: [...], user: [...] }

const chunks = chunk([1, 2, 3, 4, 5], 2);
// Returns: [[1, 2], [3, 4], [5]]

const uniqueItems = unique([1, 2, 2, 3, 3, 3]);
// Returns: [1, 2, 3]

const uniqueUsers = uniqueBy(users, 'email');

// Utility checks
if (isEmpty(value)) {
  // null, undefined, '', [], {}
}

// Formatting
const size = formatBytes(1024); // '1 KB'
const duration = formatDuration(65000); // '1m 5s'

// Pagination
const { page, limit, offset } = parsePagination(req.query);
// Default: page=1, limit=10, max limit=100
```

## Configuration

### foa.config.json

```json
{
  "server": {
    "port": 3000
  },
  "paths": {
    "actions": "src/actions",
    "flux": "src/flux"
  },
  "logging": {
    "level": "info"
  },
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}",
      "pool": {
        "max": 20,
        "idleTimeoutMillis": 30000
      }
    }
  }
}
```

## Plugins

### Database Plugin (PostgreSQL)

```typescript
// In actions
export default async function(ctx: FluxContext) {
  // Simple query
  const result = await ctx.plugins.db.query('SELECT * FROM users');
  
  // Parameterized query
  const user = await ctx.plugins.db.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );
  
  // Access pool directly
  const client = await ctx.plugins.db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO users...');
    await client.query('INSERT INTO profiles...');
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
  
  return result.rows;
}
```

## Action Function Patterns

### Basic Action

```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function getUser(ctx: FluxContext) {
  const { id } = ctx.input;
  
  const result = await ctx.plugins.db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  
  return result.rows[0];
}
```

### Action with Validation

```typescript
import { FluxContext, validateOrThrow } from 'flux-oriented-architecture';

export default async function createUser(ctx: FluxContext) {
  // Validate input
  validateOrThrow(ctx.input, {
    name: { required: true, minLength: 2 },
    email: { required: true, type: 'email' },
    age: { type: 'number', min: 18 }
  });
  
  const { name, email, age } = ctx.input;
  
  const result = await ctx.plugins.db.query(
    'INSERT INTO users (name, email, age) VALUES ($1, $2, $3) RETURNING *',
    [name, email, age]
  );
  
  return result.rows[0];
}
```

### Action with Response Helpers

```typescript
import { FluxContext, success, notFound } from 'flux-oriented-architecture';

export default async function getUserProfile(ctx: FluxContext) {
  const { id } = ctx.input;
  
  const result = await ctx.plugins.db.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  
  if (result.rows.length === 0) {
    return notFound('User');
  }
  
  return success(result.rows[0], 'User retrieved successfully');
}
```

### Action with Pagination

```typescript
import { FluxContext, paginated, parsePagination } from 'flux-oriented-architecture';

export default async function listUsers(ctx: FluxContext) {
  const { page, limit, offset } = parsePagination(ctx.input);
  
  const [usersResult, countResult] = await Promise.all([
    ctx.plugins.db.query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    ),
    ctx.plugins.db.query('SELECT COUNT(*) FROM users')
  ]);
  
  const total = parseInt(countResult.rows[0].count);
  
  return paginated(usersResult.rows, page, limit, total);
}
```

### Action with Retry Logic

```typescript
import { FluxContext, retry } from 'flux-oriented-architecture';

export default async function callExternalAPI(ctx: FluxContext) {
  const result = await retry(
    async () => {
      const response = await fetch('https://api.example.com/data');
      if (!response.ok) throw new Error('API error');
      return response.json();
    },
    { maxAttempts: 3, initialDelay: 1000 }
  );
  
  return result;
}
```

## Type Definitions

### Action Function

```typescript
type ActionFunction = (context: FluxContext) => Promise<any> | any;
```

### Flux Definition

```typescript
interface FluxDefinition {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';
  description?: string;
  flow: FlowNode[];
}
```

### Flow Nodes

```typescript
type FlowNode =
  | ActionNode
  | ConditionNode
  | ForEachNode
  | ParallelNode
  | TryNode
  | ReturnNode;

interface ActionNode {
  type: 'action';
  name: string;
  path: string;
  args?: Record<string, any>;
}

interface ReturnNode {
  type: 'return';
  status?: number;
  body: any;
}

// See flux-syntax.md for complete node definitions
```

## Error Handling

### Custom Errors

```typescript
class CustomError extends Error {
  statusCode: number;
  code: string;
  
  constructor(message: string, statusCode = 500, code = 'ERROR') {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export default async function(ctx: FluxContext) {
  if (!authorized) {
    throw new CustomError('Unauthorized', 401, 'UNAUTHORIZED');
  }
}
```

### In Flux (Try/Catch)

```json
{
  "type": "try",
  "try": [
    {
      "type": "action",
      "name": "result",
      "path": "riskyOperation"
    }
  ],
  "catch": [
    {
      "type": "return",
      "status": 500,
      "body": {
        "success": false,
        "error": "Operation failed",
        "details": "${error.message}"
      }
    }
  ],
  "errorVar": "error"
}
```

## Best Practices

1. **Use TypeScript** for type safety in actions
2. **Validate input** at the beginning of actions
3. **Use response helpers** for consistent API responses
4. **Handle errors gracefully** with try/catch nodes or custom errors
5. **Keep actions small** and focused on single responsibility
6. **Use plugins** for external dependencies (database, cache, etc)
7. **Leverage utilities** to avoid reinventing the wheel
8. **Document actions** with JSDoc comments

## Related Documentation

- [Flux Syntax](./flux-syntax.md) - Flow definition reference
- [Plugins](./plugins.md) - Plugin system guide
- [Environment Variables](./environment-variables.md) - Configuration guide
- [Getting Started](./getting-started.md) - Quick start guide