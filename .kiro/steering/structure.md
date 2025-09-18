# Project Structure

## Directory Organization

```
├── src/                    # Application source code
│   └── index.ts           # Main application entry point
├── drizzle/               # Database schema and migrations
│   ├── schema.ts          # Database table definitions
│   ├── relations.ts       # Table relationships (currently empty)
│   ├── meta/              # Migration metadata
│   └── *.sql              # Generated migration files
├── .kiro/                 # Kiro AI assistant configuration
│   └── steering/          # AI guidance documents
├── node_modules/          # Dependencies (managed by Bun)
└── [config files]        # Root-level configuration
```

## File Conventions

### Database Schema (`drizzle/`)
- **schema.ts**: Define all database tables using Drizzle's pgTable
- **relations.ts**: Define foreign key relationships between tables
- Use `createSelectSchema` from drizzle-zod for automatic Zod validation schemas
- Migration files are auto-generated, don't edit manually

### Source Code (`src/`)
- **index.ts**: Main application file with Hono app setup and routes
- Import database schema from `../drizzle/schema` (note the relative path)
- Use Hono's validator middleware for request validation
- Database connection via `drizzle(process.env.DATABASE_URL!)`

### Configuration Files
- **drizzle.config.ts**: Points to `./src/db/schema.ts` (but actual schema is in `./drizzle/schema.ts`)
- **package.json**: Minimal scripts, primarily `dev` command
- **.env**: Contains DATABASE_URL for Neon PostgreSQL connection
- **tsconfig.json**: Strict TypeScript with Hono JSX support

## Architecture Patterns

### API Structure
- Single file application in `src/index.ts`
- RESTful endpoints on root path (`/`)
- Validation using Hono validator + Zod schemas
- Database operations using Drizzle ORM

### Database Pattern
- Schema-first approach with Drizzle
- Auto-generated Zod schemas for validation
- PostgreSQL with timestamp fields (created_at, updated_at)
- Text-based primary keys