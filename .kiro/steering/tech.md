# Technology Stack

## Runtime & Build System
- **Bun**: Primary runtime and package manager
- **TypeScript**: Strict mode enabled with JSX support for Hono
- **Hot reload**: Development server with `--hot` flag

## Core Framework & Libraries
- **Hono**: Lightweight web framework for API endpoints
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Zod**: Runtime type validation and schema parsing
- **Neon Database**: Serverless PostgreSQL database

## Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **dotenv**: Environment variable management
- **tsx**: TypeScript execution for development

## Common Commands

### Development
```bash
# Install dependencies
bun install

# Start development server (hot reload)
bun run dev

# Access application
open http://localhost:3000
```

### Database Operations
```bash
# Generate migrations
bunx drizzle-kit generate

# Push schema changes
bunx drizzle-kit push

# View database studio
bunx drizzle-kit studio
```

## Configuration Notes
- Server runs on port 1337 (configured in src/index.ts)
- Database URL configured via DATABASE_URL environment variable
- CORS enabled for all origins
- Strict TypeScript compilation with JSX support