# Uptime Kuma API Bridge

Private REST/MCP API to provision and synchronize [Uptime Kuma](https://uptime.kuma.pet/)
HTTP (S) monitors and groups from an external system. Uptime Kuma ([GitHub](https://github.com/louislam/uptime-kuma))has
no built-in REST API for monitors. Everything goes through socket.io events driven by its own frontend. This bridge
connects to Uptime Kuma as an authenticated socket.io client (like a logged-in browser tab) and translates REST calls
into those same native events (`add`, `editMonitor`, `pauseMonitor`, `resumeMonitor`,
`deleteMonitor`, `getMonitor`, `getMonitorList`), so Uptime Kuma's own business logic keeps its database, its in-memory
monitor registry, and its scheduler in sync. The bridge never writes to Uptime Kuma's database directly.

Used by the [MainWP Uptime Kuma Extension](https://github.com/gaido-dev/mainwp-uptime-kuma-extension)
to sync MainWP child sites to Uptime Kuma, but usable standalone by anything that can call a REST API or an MCP tool.

> This is an independent, community project. It is not affiliated with, endorsed by, or
> supported by the [Uptime Kuma](https://github.com/louislam/uptime-kuma) project.

## Compatibility

The bridge relies on Uptime Kuma's internal socket.io events and payload shapes (`add`,
`editMonitor`, `getMonitorChartData`, `monitorImportantHeartbeatListPaged`, etc.); these are not a documented public
contract, so a future Uptime Kuma release could change their shape and break the bridge silently. Pin your Uptime Kuma
instance to a known-working version before upgrading it blindly, and treat unexpected errors right after an Uptime Kuma
upgrade as the first suspect.

## Requirements

- A dedicated Uptime Kuma user account for the bridge to log in as (`UPTIME_KUMA_SERVICE_*`), with **2FA disabled** (the
  bridge doesn't handle 2FA challenges). Uptime Kuma scopes monitors by owner, so this account can only manage
  monitors/groups it created itself. On a single-admin Uptime Kuma instance (the common case), that account already owns
  everything.
- Node.js >= 22, pnpm.

## Configuration

Copy `.env.example` to `.env` and fill in the values. Two independent secrets:

- `BRIDGE_AUTH_TOKEN`: protects this bridge's own REST API. Send it as
  `Authorization: Bearer <token>` on every request. Unrelated to Uptime Kuma's own accounts/API keys: Uptime Kuma has no
  way to authenticate a socket.io session with an API key, only username/password or a JWT derived from one.
- `UPTIME_KUMA_SERVICE_USERNAME` / `UPTIME_KUMA_SERVICE_PASSWORD`: the Uptime Kuma account the bridge logs in as to
  drive monitors.

## Development

```
git clone https://github.com/gaido-dev/uptime-kuma-api-bridge.git
cd uptime-kuma-api-bridge
pnpm install
pnpm dev        # tsx watch
pnpm typecheck
pnpm build      # tsdown -> dist/
pnpm start      # run the built output
```

## API

Interactive OpenAPI docs are served at `GET /docs` (publicly reachable, it only exposes route shapes, not monitor data).
All `/api/v1/*` routes require the bearer token.

| Method | Path                                    | Notes                                                                            |
|--------|-----------------------------------------|----------------------------------------------------------------------------------|
| GET    | `/api/v1/monitors`                      | `?type=http\|group` optional filter                                              |
| GET    | `/api/v1/monitors/:id`                  |                                                                                  |
| POST   | `/api/v1/monitors`                      | Creates an HTTP(S) monitor                                                       |
| PUT    | `/api/v1/monitors/:id`                  | Partial update, only sent fields are changed                                     |
| PATCH  | `/api/v1/monitors/:id/pause`            |                                                                                  |
| PATCH  | `/api/v1/monitors/:id/resume`           |                                                                                  |
| DELETE | `/api/v1/monitors/:id`                  | `?deleteChildren=true\|false` (groups only)                                      |
| GET    | `/api/v1/monitors/:id/heartbeats`       | `?period=24` (hours, raw heartbeat history)                                      |
| GET    | `/api/v1/monitors/:id/chart`            | `?period=24` (hours, bucketed up/down/ping data)                                 |
| GET    | `/api/v1/monitors/:id/important-events` | `?offset=0&count=25` (incident/state-change history)                             |
| GET    | `/api/v1/monitors/:id/stats`            | Uptime % (24h/30d/1y), avg ping, cert/domain expiry                              |
| GET    | `/api/v1/groups`                        |                                                                                  |
| POST   | `/api/v1/groups`                        |                                                                                  |
| GET    | `/api/v1/tags`                          |                                                                                  |
| POST   | `/api/v1/tags`                          | Creates a tag                                                                    |
| PUT    | `/api/v1/tags/:id`                      | Partial update, name/color independently optional                                |
| DELETE | `/api/v1/tags/:id`                      |                                                                                  |
| GET    | `/api/v1/notifications`                 | id + name of configured notification providers, for populating `notificationIds` |

`GET /health` and `GET /ready` are unauthenticated liveness/readiness probes; `/ready` returns 503 while the socket.io
connection to Uptime Kuma isn't established.

### Stats caveat: cert/domain expiry can start out `null`

Uptime Kuma has no request/response event for certificate or domain expiry: it only *pushes*
that data after each heartbeat cycle. The bridge caches the latest push per monitor, so
`certInfo`/`domainDaysRemaining`/`domainExpiresOn` in `GET /monitors/:id/stats` read `null` until that monitor's next
check completes after the bridge (re)connects, same as a freshly opened Uptime Kuma browser tab would show. `uptime24h`/
`uptime30d`/`uptime1y`/`avgPing24h`, by contrast, are computed on demand from `getMonitorChartData` and are always
fresh.

## MCP (LLM tool access)

Besides the REST API, the bridge exposes the same service layer as **MCP tools** over
`POST /mcp` (Streamable HTTP, stateless, no session to manage), so an LLM client (Claude Desktop, an internal agent,
etc.) can drive Uptime Kuma directly. It requires the same
`Authorization: Bearer <BRIDGE_AUTH_TOKEN>` header as the REST API. There's no separate MCP auth to configure.

Available tools: `monitors_list`, `monitors_get`, `monitors_create`, `monitors_update`,
`monitors_pause`, `monitors_resume`, `monitors_delete`, `monitors_heartbeats`, `monitors_chart`,
`monitors_important_events`, `monitors_stats`, `groups_list`, `groups_create`,
`notifications_list`, `tags_list`, `tags_create`, `tags_update`, `tags_delete`. Each is a thin wrapper around the same
`MonitorService`/`GroupService`/`NotificationService`/`TagService`
methods the REST routes call: same zod schemas, same validation, same errors.

Example Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "uptime-kuma-rest": {
      "url": "http://localhost:3050/mcp",
      "headers": {
        "Authorization": "Bearer <BRIDGE_AUTH_TOKEN>"
      }
    }
  }
}
```

To test manually without a full LLM client, use the MCP Inspector:

```
npx @modelcontextprotocol/inspector
```

Then connect it to `http://localhost:3050/mcp` (Streamable HTTP transport) with the bearer token header set, and call
tools directly from its UI.

## Manual testing

- `GET /docs`: interactive Swagger UI, generated live from the app's zod schemas. Click
  "Authorize", paste the bearer token, and try any request straight from the browser, no extra
  tool needed. `GET /docs/json` serves the same spec as raw JSON.
- `openapi.json`: the same OpenAPI 3 spec, committed at the project root
  (`pnpm openapi` regenerates it after any route/DTO change). Import it into Postman
  (`Import > File`) or Insomnia to get every route pre-built, grouped by tag
  (Monitors/Groups/Tags/Notifications/Health); both will prompt for the `baseUrl` server variable
  and the bearer token on import. Prefer the live `GET /docs/json` over this static file if
  you suspect it has drifted from a deployed instance.

## Error responses

| Situation                                                       | HTTP |
|-----------------------------------------------------------------|------|
| Missing/invalid bearer token                                    | 401  |
| Uptime Kuma socket not connected/authenticated                  | 502  |
| Uptime Kuma didn't acknowledge in time                          | 504  |
| Request body/params fail schema validation                      | 400  |
| Monitor not found (or not owned by the service account)         | 404  |
| Uptime Kuma rejected the change (cycle, conflict, etc.)         | 409  |
| Uptime Kuma rejected the change (validation, e.g. bad interval) | 422  |

## Docker

```
docker build -t uptime-kuma-api-bridge .
```

See `docker-compose.example.yml` for running it alongside an `uptime-kuma` service. The bridge only needs network access
to Uptime Kuma. No shared volume or database access required.

## Security notes

- The bridge has no TLS of its own. Put it behind a reverse proxy that terminates HTTPS (nginx, Caddy, Traefik) and
  don't expose the plain HTTP port directly to the internet.
- `BRIDGE_AUTH_TOKEN` is the only thing standing between anyone reaching the bridge and full control over your Uptime
  Kuma monitors (create/update/delete). Treat it like a credential:
  generate it randomly, never commit it, and rotate it if it ever leaks.
- There's currently no rate limiting on the API. Combined with the single static bearer token, that means a leaked token
  can be used at will until rotated; there's no lockout to slow down repeated failed attempts either.
- `GET /docs` (and `/docs/json`) is intentionally left unauthenticated: it only serves the OpenAPI schema (route shapes
  and field names), never monitor data.

## License

MIT. See [LICENSE](LICENSE).
