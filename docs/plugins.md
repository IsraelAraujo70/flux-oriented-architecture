# Plugins

FOA supports a plugin system to extend its capabilities with Database, Cache, Auth, and Email integrations.

## Overview

Plugins allow you to add functionality to your FOA application without writing boilerplate code. They are configured in `foa.config.json` and automatically injected into the context of your actions.

## Configuration

Plugins are defined in the `plugins` section of `foa.config.json`:

```json
{
  "server": {
    "port": 3000
  },
  "paths": {
    "actions": "src/actions",
    "flux": "src/flux"
  },
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}"
    }
  }
}
```

## Environment Variables

Plugin configurations support environment variable interpolation using the `${VAR_NAME}` syntax. Create a `.env` file in your project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

The FOA framework automatically loads `.env` files and replaces placeholders in your config.

## Available Plugins

### Database Plugin

#### PostgreSQL

```json
{
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}",
      "pool": {
        "max": 20,
        "idleTimeoutMillis": 30000,
        "connectionTimeoutMillis": 2000
      }
    }
  }
}
```

**Usage in Actions:**

```typescript
import { FluxContext } from 'flux-oriented-architecture';

export default async function listUsers(ctx: FluxContext) {
  const result = await ctx.plugins.db.query(
    'SELECT * FROM users WHERE active = $1',
    [true]
  );
  
  return result.rows;
}
```

**Available Methods:**

- `query(sql: string, params?: any[])`: Execute a SQL query
- `pool`: Access the underlying pg Pool instance

#### MySQL (Coming Soon)

```json
{
  "plugins": {
    "database": {
      "type": "mysql",
      "connectionString": "${DATABASE_URL}"
    }
  }
}
```

#### MongoDB (Coming Soon)

```json
{
  "plugins": {
    "database": {
      "type": "mongodb",
      "connectionString": "${MONGODB_URL}"
    }
  }
}
```

#### SQLite (Coming Soon)

```json
{
  "plugins": {
    "database": {
      "type": "sqlite",
      "filename": "database.db"
    }
  }
}
```

### Cache Plugin (Coming Soon)

#### Redis

```json
{
  "plugins": {
    "cache": {
      "type": "redis",
      "url": "${REDIS_URL}"
    }
  }
}
```

**Usage in Actions:**

```typescript
export default async function getCachedUser(ctx: FluxContext) {
  const { id } = ctx.input;
  
  // Try to get from cache
  const cached = await ctx.plugins.cache.get(`user:${id}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const user = await ctx.plugins.db.query('SELECT * FROM users WHERE id = $1', [id]);
  
  // Store in cache for 1 hour
  await ctx.plugins.cache.set(`user:${id}`, JSON.stringify(user), 3600);
  
  return user;
}
```

#### Memory Cache

```json
{
  "plugins": {
    "cache": {
      "type": "memory",
      "maxSize": 1000
    }
  }
}
```

### Auth Plugin (Coming Soon)

#### JWT

```json
{
  "plugins": {
    "auth": {
      "type": "jwt",
      "secret": "${JWT_SECRET}",
      "expiresIn": "7d"
    }
  }
}
```

**Usage in Actions:**

```typescript
export default async function login(ctx: FluxContext) {
  const { email, password } = ctx.input;
  
  // Validate user credentials
  const user = await validateUser(email, password);
  
  // Generate JWT token
  const token = await ctx.plugins.auth.sign({
    userId: user.id,
    email: user.email
  });
  
  return { token, user };
}
```

#### Session

```json
{
  "plugins": {
    "auth": {
      "type": "session",
      "secret": "${SESSION_SECRET}",
      "store": "redis"
    }
  }
}
```

### Email Plugin (Coming Soon)

#### SMTP

```json
{
  "plugins": {
    "email": {
      "type": "smtp",
      "host": "${SMTP_HOST}",
      "port": 587,
      "auth": {
        "user": "${SMTP_USER}",
        "pass": "${SMTP_PASS}"
      }
    }
  }
}
```

**Usage in Actions:**

```typescript
export default async function sendWelcomeEmail(ctx: FluxContext) {
  const { email, name } = ctx.input;
  
  await ctx.plugins.email.send({
    to: email,
    subject: 'Welcome!',
    html: `<h1>Welcome, ${name}!</h1>`
  });
  
  return { sent: true };
}
```

#### SendGrid

```json
{
  "plugins": {
    "email": {
      "type": "sendgrid",
      "apiKey": "${SENDGRID_API_KEY}"
    }
  }
}
```

## Creating Custom Plugins

To create a custom plugin, implement the `IPlugin` interface:

```typescript
import { IPlugin } from 'flux-oriented-architecture';

export class MyCustomPlugin implements IPlugin {
  name = 'myPlugin';
  private client: any;

  async setup(config: any): Promise<void> {
    // Initialize your plugin
    this.client = await createClient(config);
  }

  async teardown(): Promise<void> {
    // Cleanup resources
    await this.client.close();
  }

  getClient(): any {
    if (!this.client) {
      throw new Error('Plugin not initialized');
    }
    return this.client;
  }
}
```

Then register it in your application:

```typescript
import { FluxServer } from 'flux-oriented-architecture';
import { MyCustomPlugin } from './plugins/myPlugin';

const server = new FluxServer();

// Add custom plugin before init
server.addPlugin('myPlugin', new MyCustomPlugin());

await server.init();
await server.start();
```

## Plugin Lifecycle

1. **Configuration Load**: FOA reads `foa.config.json` and interpolates environment variables
2. **Plugin Setup**: Each plugin's `setup()` method is called with its configuration
3. **Injection**: Plugin clients are injected into `context.plugins` for each request
4. **Teardown**: When the server shuts down, `teardown()` is called on each plugin

## Best Practices

1. **Use Environment Variables**: Never hardcode sensitive data like passwords or API keys
2. **Connection Pooling**: Database plugins automatically manage connection pools
3. **Error Handling**: Plugins throw errors on connection failures; use try/catch nodes in flux
4. **Resource Cleanup**: Plugins automatically cleanup on server shutdown

## Migration Scripts

For database plugins, FOA provides a simple migration system to manage your database schema.

### Setup

1. Create a `migrations/` directory in your project root
2. Add SQL files with numeric prefixes (e.g., `001-`, `002-`)
3. Add the migration script to your `package.json`

**package.json:**
```json
{
  "scripts": {
    "migrate": "node scripts/migrate.js"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "pg": "^8.16.3"
  }
}
```

**scripts/migrate.js:**
```javascript
#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

async function runMigrations() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No SQL migration files found');
      return;
    }

    console.log(`📋 Found ${files.length} migration file(s):\n`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ Running: ${file}`);

      try {
        await client.query(sql);
        console.log(`✅ Success: ${file}\n`);
      } catch (error) {
        console.error(`❌ Failed: ${file}`);
        console.error(`Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigrations();
```

### Running Migrations

```bash
# Run all migrations
npm run migrate
```

### Migration Files

Place SQL files in `migrations/` directory with numeric prefixes:

```
migrations/
├── 001-create-users.sql
├── 002-create-products.sql
├── 003-add-indexes.sql
└── 004-seed-data.sql
```

**migrations/001-create-users.sql:**
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**migrations/002-create-products.sql:**
```sql
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_name ON products(name);
```

**migrations/003-add-indexes.sql:**
```sql
-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

**migrations/004-seed-data.sql:**
```sql
-- Insert sample data
INSERT INTO products (name, price, description) VALUES
  ('Laptop', 1299.99, 'High-performance laptop'),
  ('Mouse', 29.99, 'Wireless mouse'),
  ('Keyboard', 79.99, 'Mechanical keyboard')
ON CONFLICT DO NOTHING;
```

### Best Practices

1. **Use IF NOT EXISTS**: Makes migrations idempotent
2. **Numeric Prefixes**: Ensures execution order (001-, 002-, 003-)
3. **One Change Per File**: Easier to track and rollback
4. **Descriptive Names**: `001-create-users.sql` not `001.sql`
5. **Test Locally First**: Run migrations on local DB before production

### Example Output

```bash
$ npm run migrate

🔌 Connecting to database...
✅ Connected successfully

📋 Found 4 migration file(s):

⏳ Running: 001-create-users.sql
✅ Success: 001-create-users.sql

⏳ Running: 002-create-products.sql
✅ Success: 002-create-products.sql

⏳ Running: 003-add-indexes.sql
✅ Success: 003-add-indexes.sql

⏳ Running: 004-seed-data.sql
✅ Success: 004-seed-data.sql

🎉 All migrations completed successfully!

🔌 Database connection closed
```

## Example: Complete Setup

```json
{
  "server": {
    "port": 3000
  },
  "paths": {
    "actions": "src/actions",
    "flux": "src/flux"
  },
  "plugins": {
    "database": {
      "type": "postgres",
      "connectionString": "${DATABASE_URL}",
      "pool": {
        "max": 20
      }
    },
    "cache": {
      "type": "redis",
      "url": "${REDIS_URL}"
    },
    "auth": {
      "type": "jwt",
      "secret": "${JWT_SECRET}",
      "expiresIn": "7d"
    },
    "email": {
      "type": "sendgrid",
      "apiKey": "${SENDGRID_API_KEY}"
    }
  }
}
```

## Troubleshooting

### Plugin Not Initialized Error

**Problem**: `Error: Database not initialized`

**Solution**: Make sure the plugin configuration is correct and `setup()` completed successfully. Check logs for connection errors.

### Environment Variables Not Found

**Problem**: `Environment variable "DATABASE_URL" is not defined`

**Solution**: Create a `.env` file in your project root with the required variables.

### Connection Failures

**Problem**: Plugin fails to connect to external service

**Solution**: 
- Verify the connection string format
- Check network connectivity
- Ensure the service is running
- Validate credentials

## Status

- ✅ **PostgreSQL**: Fully implemented
- 🚧 **MySQL**: Coming soon
- 🚧 **MongoDB**: Coming soon
- 🚧 **SQLite**: Coming soon
- 🚧 **Redis Cache**: Coming soon
- 🚧 **Memory Cache**: Coming soon
- 🚧 **JWT Auth**: Coming soon
- 🚧 **Session Auth**: Coming soon
- 🚧 **SMTP Email**: Coming soon
- 🚧 **SendGrid Email**: Coming soon