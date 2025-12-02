# Environment Variables

FOA provides built-in support for environment variables, allowing you to configure your application without hardcoding sensitive data.

## Overview

The environment system automatically:
- Loads variables from `.env` files
- Interpolates `${VAR_NAME}` placeholders in configuration
- Prioritizes system environment variables over file values
- Works recursively with nested objects and arrays

## Creating a .env File

Create a `.env` file in your project root:

```env
# Database Configuration
DATABASE_URL=postgresql://admin:password@localhost:5432/mydb

# Server Configuration
PORT=3000
HOST=0.0.0.0

# API Keys
JWT_SECRET=your-secret-key-here
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# External Services
REDIS_URL=redis://localhost:6379
API_BASE_URL=https://api.example.com

# Feature Flags
ENABLE_CACHE=true
LOG_LEVEL=info
```

## Using Environment Variables

### In Configuration Files

Use `${VAR_NAME}` syntax in `foa.config.json`:

```json
{
  "server": {
    "port": 3000
  },
  "logging": {
    "level": "${LOG_LEVEL}"
  },
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}"
    },
    "cache": {
      "type": "redis",
      "url": "${REDIS_URL}"
    },
    "auth": {
      "type": "jwt",
      "secret": "${JWT_SECRET}"
    }
  }
}
```

### In Action Code

Access environment variables directly in your actions:

```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function callExternalAPI(ctx: FluxContext) {
  const apiUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY;
  
  const response = await fetch(`${apiUrl}/data`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });
  
  return response.json();
}
```

### Programmatic Access

Use the Environment API for advanced scenarios:

```typescript
import { getEnvironment } from 'flux-oriented-architecture';

const env = getEnvironment();

// Load from custom path
env.load('/path/to/.env.custom');

// Get variable with default value
const port = env.get('PORT', '3000');

// Check if variable exists
if (env.has('REDIS_URL')) {
  // Redis is configured
}

// Interpolate a string
const message = env.interpolate('Server running on ${HOST}:${PORT}');

// Interpolate an entire object
const config = env.interpolateObject({
  database: '${DATABASE_URL}',
  port: '${PORT}'
});
```

## Interpolation Rules

### Full Expression Replacement

When a placeholder is the entire value, it's replaced with the actual type:

```json
{
  "port": "${PORT}",           // If PORT=3000 → returns number 3000
  "enabled": "${ENABLE_CACHE}" // If ENABLE_CACHE=true → returns boolean true
}
```

### String Interpolation

When embedded in a string, values are converted to strings:

```json
{
  "message": "Server on port ${PORT}"  // Returns: "Server on port 3000"
}
```

### Nested Objects

Interpolation works recursively:

```json
{
  "database": {
    "primary": {
      "url": "${PRIMARY_DB_URL}",
      "pool": {
        "max": "${DB_POOL_MAX}"
      }
    },
    "replica": {
      "url": "${REPLICA_DB_URL}"
    }
  }
}
```

### Arrays

Interpolation works in array elements:

```json
{
  "allowedOrigins": [
    "${FRONTEND_URL}",
    "${ADMIN_URL}",
    "https://app.example.com"
  ]
}
```

## Variable Priority

Variables are loaded in this order (later values override earlier ones):

1. `.env` file values
2. System environment variables (highest priority)

```env
# .env file
API_KEY=from-file
```

```bash
# System environment
export API_KEY=from-system

# The system value "from-system" wins
```

## Environment-Specific Configuration

### Multiple .env Files

```bash
.env                # Default configuration
.env.development    # Development overrides
.env.production     # Production overrides
.env.local          # Local overrides (git-ignored)
```

Load specific files programmatically:

```typescript
import { resolveEnvVariables } from 'flux-oriented-architecture';

const config = resolveEnvVariables(rawConfig, '.env.production');
```

### Environment Detection

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

if (isDevelopment) {
  // Development-specific logic
}
```

## Best Practices

### 1. Never Commit Sensitive Data

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
```

### 2. Provide Example Files

Create `.env.example` with dummy values:

```env
# .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-here
SENDGRID_API_KEY=SG.your-key-here
```

### 3. Document Required Variables

In your README or docs:

```markdown
## Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT signing
- `PORT`: Server port (default: 3000)
```

### 4. Use Descriptive Names

```env
# Good
DATABASE_URL=postgresql://...
JWT_SECRET=abc123
SMTP_HOST=smtp.gmail.com

# Bad
DB=postgresql://...
SECRET=abc123
HOST=smtp.gmail.com
```

### 5. Group Related Variables

```env
# Database Configuration
DATABASE_URL=postgresql://...
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# Cache Configuration
REDIS_URL=redis://...
REDIS_TTL=3600

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=user@gmail.com
SMTP_PASS=password
```

### 6. Validate Required Variables

```typescript
export default async function startup(ctx: FluxContext) {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  
  for (const varName of required) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
  
  return { validated: true };
}
```

## Common Patterns

### Connection Strings

```env
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# MySQL
DATABASE_URL=mysql://user:password@localhost:3306/dbname

# MongoDB
MONGODB_URL=mongodb://user:password@localhost:27017/dbname

# Redis
REDIS_URL=redis://localhost:6379
```

### API Keys and Secrets

```env
JWT_SECRET=your-256-bit-secret-key-here
API_KEY=sk_live_xxxxxxxxxxxxxxxx
ENCRYPTION_KEY=base64-encoded-key-here
```

### Feature Flags

```env
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=false
DEBUG_MODE=false
```

### URLs and Endpoints

```env
API_BASE_URL=https://api.example.com
FRONTEND_URL=https://app.example.com
WEBHOOK_URL=https://webhook.example.com/events
```

## Troubleshooting

### Variable Not Found Warning

**Problem**: `Environment variable "DATABASE_URL" is not defined`

**Solution**: 
- Verify the `.env` file exists in project root
- Check the variable name spelling
- Ensure the file is properly formatted (KEY=value)

### Value Not Interpolated

**Problem**: Config shows `${DATABASE_URL}` literally

**Solution**:
- Make sure you're using the FOA server (it auto-loads env)
- Check that `.env` file has the variable defined
- Verify no typo in variable name

### Variables Not Loading

**Problem**: Environment variables aren't being picked up

**Solution**:
- Ensure `.env` is in the correct directory (project root)
- Check file permissions (must be readable)
- Restart the server after changing `.env`
- Use absolute paths if loading from custom location

## Security Considerations

### 1. Sensitive Data

Never log or expose sensitive environment variables:

```typescript
// Bad
console.log('Config:', process.env);

// Good
console.log('Config loaded successfully');
```

### 2. Production Secrets

Use secure secret management in production:

- AWS Secrets Manager
- HashiCorp Vault
- Kubernetes Secrets
- Docker Secrets

### 3. Minimal Exposure

Only load variables you actually need:

```typescript
// Good - selective access
const dbUrl = process.env.DATABASE_URL;

// Avoid - exposes everything
const allEnv = process.env;
```

## Examples

### Complete Setup

**`.env`:**
```env
DATABASE_URL=postgresql://admin:pass@localhost:5432/myapp
REDIS_URL=redis://localhost:6379
JWT_SECRET=super-secret-key-12345
PORT=3000
```

**`foa.config.json`:**
```json
{
  "server": {
    "port": "${PORT}"
  },
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}"
    },
    "cache": {
      "type": "redis",
      "url": "${REDIS_URL}"
    },
    "auth": {
      "type": "jwt",
      "secret": "${JWT_SECRET}"
    }
  }
}
```

**Action using env:**
```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function getConfig(ctx: FluxContext) {
  return {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    hasCache: !!process.env.REDIS_URL
  };
}
```

## API Reference

### Environment Class

```typescript
import { Environment, getEnvironment } from 'flux-oriented-architecture';

const env = getEnvironment();

// Load environment file
env.load(path?: string): void

// Get a variable
env.get(key: string, defaultValue?: string): string | undefined

// Check if variable exists
env.has(key: string): boolean

// Interpolate a string
env.interpolate(value: string): string

// Interpolate an object
env.interpolateObject<T>(obj: T): T

// Reset (for testing)
env.reset(): void
```

### resolveEnvVariables Function

```typescript
import { resolveEnvVariables } from 'flux-oriented-architecture';

// Load and interpolate config
const config = resolveEnvVariables(rawConfig, envPath?);
```

## Related Documentation

- [Plugins](./plugins.md) - Using environment variables in plugin configuration
- [Configuration](./getting-started.md#configuration) - General configuration guide
- [Security Best Practices](./api-reference.md) - Securing your application