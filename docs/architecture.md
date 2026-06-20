# Architecture — TeamFit

> Documento vivo. Aggiornare quando cambiano bounded context, layer o topologia di deploy.

## 1. Vista d'insieme

TeamFit è una SPA React che consuma una API .NET 10 (minimal API) basata su
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
  Api[TeamFit.Api<br/>Minimal API + Swagger + DI]
  Infra[TeamFit.Infrastructure<br/>EF Core + DbContext + Repositories + Seed]
  App[TeamFit.Application<br/>Use cases + DTO + Validators + AlertEvaluator + IClock]
  Domain[TeamFit.Domain<br/>Aggregate + Entity + VO + Domain Exceptions]

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

Due topologie documentate in **[docs/infra-design.md](infra-design.md)**:

| Topologia | Quando usarla |
|---|---|
| **POC** | Validazione rapida, costi ~€50–80/mese + consumo Azure OpenAI. App Service pubblico in ingresso, data service e Azure AI Foundry privati via VNet Integration + Private Endpoint. Frontend su Static Web App Free di default; linked backend `/api/*` opzionale richiede Static Web App Standard. |
| **Enterprise** | Produzione hardened, costi ~€705–800/mese + consumo Azure OpenAI. Tutto privato dietro Application Gateway WAF_v2; Azure OpenAI via Azure AI Foundry privato. Nessun backend esposto direttamente. |

### POC — schema sintetico

```mermaid
flowchart TB
  subgraph Internet
    User[Browser]
  end

  subgraph RG[rg-verde]
    SWA[Static Web App\nFree tier]
    Plan[App Service Plan B1 Linux]
    API[App Service .NET 10\npublic inbound]
    VNet[VNet 10.0.0.0/16]
    SQL[(Azure SQL\nprivate endpoint)]
    Cosmos[(Cosmos DB\nprivate endpoint)]
    ST[(Storage Account\nprivate endpoint)]
    KV[(Key Vault\nprivate endpoint)]
    AOAI[Azure AI Foundry\nprivate endpoint\ninternal only]
    LAW[Log Analytics]
    APPI[Application Insights]
  end

  User -->|HTTPS| SWA
  SWA -->|CORS diretto; linked backend opzionale su Standard| API
  API -->|VNet Integration outbound| VNet
  VNet --> SQL
  VNet --> Cosmos
  VNet --> ST
  VNet --> KV
  API -->|internal AI calls via VNet| AOAI
  API --> APPI --> LAW
```

### Enterprise — schema sintetico

```mermaid
flowchart TB
  subgraph Internet
    User[Browser]
  end

  subgraph RG[rg-teamfit-enterprise]
    AGW[App Gateway WAF_v2\npublic IP]
    FE[Frontend App Service P1v3\nnginx + React build\nprivate endpoint]
    BE[Backend App Service P1v3\n.NET 10 API\nprivate endpoint]
    VM[VM Agent Standard_B2s\nCI/CD self-hosted]
    VNet[VNet 10.0.0.0/16]
    SQL[(Azure SQL\nprivate endpoint)]
    Cosmos[(Cosmos DB\nprivate endpoint)]
    ST[(Storage Account\nprivate endpoint)]
    KV[(Key Vault\nprivate endpoint)]
    AOAI[Azure OpenAI via Azure AI Foundry\nprivate endpoint\ninternal only]
    LAW[Log Analytics]
    APPI[Application Insights]
  end

  User -->|HTTPS| AGW
  AGW -->|private endpoint| FE
  FE -->|VNet /api/* proxy| BE
  FE -->|VNet Integration| VNet
  BE -->|VNet Integration| VNet
  VM -->|SCM private endpoint| FE
  VM -->|SCM private endpoint| BE
  VNet --> SQL
  VNet --> Cosmos
  VNet --> ST
  VNet --> KV
  BE -->|internal AI calls via VNet| AOAI
  FE --> APPI
  BE --> APPI
  APPI --> LAW
```

Per dettagli completi (subnet, NSG, DNS zone, costi, note tecniche) vedere
[docs/infra-design.md](infra-design.md).

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
| azurerm provider | ≥ 4.30 |
| azapi provider | ≥ 2.0 |

Le versioni esatte vengono congelate nei file `csproj`, `package.json`, `versions.tf` durante la Fase 2. Il Terraform POC vive in `infra/terraform/`.
