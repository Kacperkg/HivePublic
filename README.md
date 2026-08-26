# The Hive

The Hive is a dark, iPhone-first workout planner for building consistent training behavior. It combines reusable workout templates, calendar scheduling, set-by-set execution, rest timing, and daily progress totals without changing the visual identity of the original product concept.

The project began as a university dissertation application. After the dissertation was completed, the original prototype was audited, cleaned up, and comprehensively rebuilt to improve its architecture, security, reliability, developer experience, and suitability for public release while retaining its established product identity.

This repository is a ground-up, public-quality rewrite: Expo/React Native and strict TypeScript on the client, a small Go API, PostgreSQL persistence, versioned migrations, and a reproducible Docker development environment.

<table>
  <tr>
    <td><img src="docs/screenshots/onboarding.png" alt="The Hive onboarding screen" width="260"></td>
    <td><img src="docs/screenshots/auth-choice.png" alt="The Hive login or registration screen" width="260"></td>
    <td><img src="docs/screenshots/login.png" alt="The Hive login screen" width="260"></td>
  </tr>
</table>

## Features

- Email/password accounts with bcrypt password hashing and revocable opaque sessions.
- Ordered workout templates with exercise, set, repetition, and weight targets.
- Monday-first monthly scheduling with planned, completed, and missed states.
- Snapshot-based assignments: editing a template never rewrites scheduled history.
- Set-by-set workout execution, skipped sets, configurable rest timing, and a circular countdown.
- Daily exercise, repetition, and lifted-volume totals.
- Intentional loading, empty, validation, offline, timeout, expired-session, and server-error behavior.
- Safe-area-aware layouts tested at 375×667, 393×852, and 430×932 viewports.

## Technology

| Layer | Choice |
| --- | --- |
| Mobile | Expo SDK 57, React Native, TypeScript, React Navigation 7 |
| Server state | TanStack Query |
| Device session storage | Expo Secure Store |
| API | Go 1.26, `net/http`, `log/slog` |
| Database | PostgreSQL 18, pgx driver, explicit SQL migrations |
| Local environment | Docker Compose |
| Contract | OpenAPI 3.1 |
| CI | GitHub Actions |

Expo SDK packages are kept as one compatible set, following the [Expo SDK reference](https://docs.expo.dev/versions/latest/). Navigation follows the [React Navigation setup guidance](https://reactnavigation.org/docs/getting-started/).

## Architecture

```text
.
├── apps/mobile/              Expo React Native application
│   ├── src/api/              typed client, models, structured errors
│   ├── src/auth/             session bootstrap and secure persistence
│   ├── src/components/       shared design primitives
│   ├── src/features/         feature screens and local interactions
│   ├── src/navigation/       typed auth, tab, and detail flows
│   └── src/theme/            legacy-faithful design tokens
├── backend/
│   ├── cmd/api/              API process
│   ├── cmd/migrate/          deterministic migration command
│   ├── internal/             domain, HTTP, auth, store, configuration
│   └── migrations/           ordered PostgreSQL schema changes
├── bin/                      small development entry points
├── docs/                     discovery, architecture, OpenAPI, screenshots
├── .github/workflows/        automated verification
└── docker-compose.yml        frontend, backend, and PostgreSQL
```

The backend uses transport → domain/service rules → PostgreSQL boundaries without a large framework or ORM. Assigning a workout copies its ordered exercise/set targets into relational snapshot rows in a transaction. Sessions store only a SHA-256 token digest, so logout revocation is immediate and a database leak does not expose usable bearer tokens.

See [architecture.md](docs/architecture.md), the [legacy discovery audit](docs/discovery.md), and the [OpenAPI contract](docs/openapi.yaml).

## Start with Docker

Requirements:

- Docker Desktop or Docker Engine with Compose v2
- An iOS simulator or physical device when testing native behavior

```bash
cp .env.example .env
./bin/start.sh
```

This builds and starts:

- Expo/Metro on `http://localhost:8081`
- the API on `http://localhost:8080`
- PostgreSQL on `localhost:5433`

The API waits for PostgreSQL health, applies pending migrations, and then starts. It still retries its own database connection because container order alone is not readiness.

Stop or inspect the environment:

```bash
./bin/stop.sh
./bin/restart.sh
./bin/logs.sh
./bin/logs.sh backend
```

PostgreSQL data is held in the named `postgres_data` volume mounted at `/var/lib/postgresql`, the correct persistence root for the PostgreSQL 18 image. `./bin/stop.sh` keeps it. `./bin/reset-db.sh` requires an explicit confirmation and removes it.

### React Native Docker limitation

Docker runs Metro, not the iOS simulator. The simulator remains a host application. The default localhost configuration works for the web build and an iOS simulator on the same Mac. A physical phone must be on the same network and needs `EXPO_PUBLIC_API_URL` (and potentially Expo host settings) changed from `localhost` to the development machine’s LAN address. The Compose-internal name `backend` is valid only between containers and must never be used by the phone.

## Run without Docker

Start PostgreSQL and set a host-reachable `DATABASE_URL`, then:

```bash
cp .env.example .env
cd backend
DATABASE_URL='postgres://the_hive:development-only-password@localhost:5432/the_hive?sslmode=disable' go run ./cmd/migrate
DATABASE_URL='postgres://the_hive:development-only-password@localhost:5432/the_hive?sslmode=disable' go run ./cmd/api
```

In another terminal:

```bash
npm ci
cp apps/mobile/.env.example apps/mobile/.env
npm run start --workspace @the-hive/mobile
```

The credentials above are intentionally development-only placeholders.

## Environment

| Variable | Purpose | Default/example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by API and migrations | Compose service `postgres` |
| `APP_ENV` | `development`, `testing`, or `production` logging mode | `development` |
| `HTTP_ADDR` | API listen address | `:8080` |
| `SESSION_TTL_HOURS` | Opaque session lifetime | `720` |
| `ALLOWED_ORIGINS` | Comma-separated web-development CORS allowlist | local Metro origins |
| `EXPO_PUBLIC_API_URL` | Mobile-visible API base URL, including `/v1` | `http://localhost:8080/v1` |

No environment file or credential belongs in Git. Production must use a TLS-enabled `DATABASE_URL`, strong externally managed database credentials, HTTPS for the API, and platform-specific package identifiers.

## Migrations

All schema changes are ordered SQL files in `backend/migrations`. Applied filenames and SHA-256 checksums are recorded in `schema_migrations`; changing an already applied migration fails rather than silently drifting.

```bash
./bin/migrate.sh
```

Create a new migration pair for every subsequent schema change. Do not edit a migration that may have been deployed.

## Verification

```bash
./bin/lint.sh
./bin/test.sh
```

Or run checks individually:

```bash
npm run format
npm run lint
npm run typecheck
npm run test:mobile

cd backend
gofmt -w .
go vet ./...
go test ./...
go build ./cmd/api ./cmd/migrate
```

CI additionally exports the mobile web bundle and builds the minimal backend production image.

## API behavior

Success responses use `{ "data": ... }`. Failures use a stable public envelope:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Check the highlighted fields.",
    "fields": { "name": "is required" }
  }
}
```

Internal database errors and stack traces are logged with a request ID and never returned to clients. See [openapi.yaml](docs/openapi.yaml) for every endpoint and schema.

## Project status

Core rewrite functionality is implemented and automated checks pass. Onboarding was visually checked at representative small, standard, Pro, and Pro Max viewport dimensions. Before an App Store release:

- run the full flow on real iPhone hardware and supported iOS simulators;
- replace example iOS/Android application identifiers;
- configure production HTTPS and secrets management;
- confirm the redistribution rights for the retained onboarding photo collage;
- complete store icons, splash artwork, privacy disclosures, and release signing.

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md). Do not include live credentials or personal data in an issue.
