# Architecture — Man-Agent

> Documento vivo. Aggiornare quando cambiano bounded context, layer o topologia di deploy.

## 1. Vista d'insieme

Man-Agent è una SPA React che consuma una API .NET 10 (minimal API) basata su
DDD a 4 layer, persistenza Azure SQL via EF Core. Single-tenant. Auth mock.

```mermaid
flowchart LR
  User[Utente browser] -->|HTTPS| SWA[Azure Static Web App<br/>React + TS + Ant Design]
  SWA -->|REST + X-User-Id| API[Azure App Service Linux<br/>.NET 10 Minimal API]
  API --> DB[(Azure SQL Database)]
  API -.->|allegati futuri| Blob[(Storage Account)]
```

In dev locale: Vite (`:5173`) → proxy → Kestrel (`:5000`) → LocalDB / SQL Express.

## 2. Backend: layer DDD

```mermaid
flowchart TD
  Api[ManAgent.Api<br/>Minimal API + Swagger + DI]
  Infra[ManAgent.Infrastructure<br/>EF Core + DbContext + Repositories + Seed]
  App[ManAgent.Application<br/>Use cases + DTO + Validators + AlertEvaluator + IClock]
  Domain[ManAgent.Domain<br/>Aggregate + Entity + VO + Domain Exceptions]

  Api --> Infra
  Infra --> App
  App --> Domain
```

Regola: **le dipendenze puntano sempre verso l'interno** (Onion). `Domain` non ha
dipendenze esterne (solo BCL).

## 3. Bounded Context

```mermaid
flowchart LR
  Projects[Projects<br/>Project · Allocation · Status · KPI]
  Customers[Customers<br/>Customer]
  Workforce[Workforce<br/>Figure A→F · Employee]
  Identity[Identity<br/>User · UserRole]
  Alerting[Alerting<br/>AlertRule · AlertInstance · AlertEvaluator]

  Projects -.referenze id.-> Customers
  Projects -.referenze id.-> Workforce
  Projects -.referenze id.-> Identity
  Alerting -.legge.-> Projects
  Identity -.referenze id.-> Workforce
```

Comunicazione **per id**, no foreign-key cross-context fra aggregate (regola DDD).
EF Core mappa le relazioni a livello DB per query efficaci, ma il codice di
dominio non naviga riferimenti cross-context.

## 4. Flusso autorizzazione (mock)

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant MW as AuthHeaderMiddleware
  participant EP as Endpoint
  participant UC as UseCase
  participant DB as DbContext

  FE->>MW: GET /api/progetti<br/>X-User-Id: 42
  MW->>DB: load User(42)
  MW->>EP: enrich ICurrentUser
  EP->>UC: GetProjectsForCurrentUserQuery
  UC->>DB: query filtered by role<br/>(PM → PmId == 42, Presales → PresalesId == 42, Manager/Admin → all)
  UC-->>EP: List<ProjectListItemDto>
  EP-->>FE: 200 OK
```

## 5. Flusso alerting

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant EP as /api/alerts
  participant EV as AlertEvaluator
  participant DB as DbContext

  FE->>EP: GET /api/alerts
  EP->>DB: load Active projects + allocations
  EP->>EV: Evaluate(projects, clock.Now)
  EV-->>EP: List<AlertInstance>
  EP-->>FE: 200 OK (filtered by current user role)
```

L'evaluator è puro: input → output, niente side effect. Per l'MVP non persistiamo
gli alert (sono ricalcolati on-demand).

## 6. Deploy target Azure (predisposto, no apply nell'MVP)

```mermaid
flowchart TB
  subgraph RG[Resource Group rg-manAgent-dev]
    SWA[Static Web App<br/>Standard tier]
    Plan[App Service Plan Linux<br/>B1]
    API[App Service<br/>.NET 10]
    SQL[Azure SQL Server]
    DB[(SQL Database<br/>Basic / Serverless)]
    ST[Storage Account<br/>Standard LRS]
  end

  SWA -. linked backend .-> API
  API --> DB
  Plan --- API
  SQL --- DB
```

Risorse Terraform:
- `azurerm_resource_group`
- `azurerm_static_web_app`
- `azurerm_service_plan` + `azurerm_linux_web_app`
- `azurerm_mssql_server` + `azurerm_mssql_database`
- `azurerm_storage_account`

Output: hostname SWA, hostname Web App, connection string SQL (sensitive).

## 7. Versioning componenti

| Componente | Versione target |
| --- | --- |
| .NET | 10 (preview/RTM disponibile) |
| EF Core | 10.x |
| Node.js | LTS corrente (≥ 20) |
| Vite | 5.x |
| React | 18.x |
| TypeScript | 5.x |
| Ant Design | 5.x |
| TanStack Query | 5.x |
| Zustand | 4.x |
| Recharts | 2.x |
| Terraform | ≥ 1.7 |
| azurerm provider | ≥ 3.100 |

Le versioni esatte vengono congelate nei file `csproj`, `package.json`, `versions.tf` durante la Fase 2.
