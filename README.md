To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## Environment variables

The API expects the following secrets to be available (for example via `wrangler.toml` bindings or a local `.env` file when running scripts):

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Connection string for the Postgres database. |
| `ACCESS_TOKEN_SECRET` | Secret used to sign short-lived JWT access tokens. |
| `REFRESH_TOKEN_SECRET` | Secret used to mint and validate refresh tokens. |
| `ACCESS_TOKEN_TTL_SECONDS` | Optional override for the access token lifetime (defaults to 900 seconds). |
| `REFRESH_TOKEN_TTL_SECONDS` | Optional override for the refresh token lifetime (defaults to 2,592,000 seconds). |

Run tests with:

```sh
pnpm test
```
