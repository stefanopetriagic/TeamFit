---
name: backend-ddd
description: Regole per il backend .NET 10 DDD di Man-Agent. USE WHEN si lavora in backend/, si creano o modificano aggregate, entity, value object, use case, controller/minimal API, repository, configurazioni EF Core, migrations, test xUnit, regole di alerting. Triggers - .NET, C#, dotnet, dominio, aggregate, entity, value object, use case, command, query, repository, EF Core, migration, controller, endpoint, minimal API, alerting, write-up, write-off, budget, progetto, allocazione, consuntivo, figura professionale, ruolo utente.
---

# Backend DDD — Man-Agent

Backend .NET 10 con architettura DDD a 4 layer. Leggi sempre
[AGENTS.md](../../../AGENTS.md), [docs/domain-model.md](../../../docs/domain-model.md)
e [docs/guidelines.md](../../../docs/guidelines.md) prima di modificare codice.

## Architettura a layer (Onion)

```
ManAgent.Api ──► ManAgent.Infrastructure ──► ManAgent.Application ──► ManAgent.Domain
                                                                       (no deps esterne)
```

| Progetto | Contiene | NON contiene |
| --- | --- | --- |
| `ManAgent.Domain` | aggregate, entity, value object, eventi di dominio, enum, eccezioni di dominio, interfacce repository | EF Core, ASP.NET, HTTP, I/O, JSON |
| `ManAgent.Application` | use case (command/query handler), DTO, validators, `IClock`, `ICurrentUser`, `AlertEvaluator` | implementazioni EF Core, controller |
| `ManAgent.Infrastructure` | `ManAgentDbContext`, `IEntityTypeConfiguration<T>`, repository concreti, `SeedData`, implementazione `IClock` (`SystemClock`) | regole di business |
| `ManAgent.Api` | minimal API endpoints, middleware, Swagger, `Program.cs`, DI registration, CORS | logica di business, accesso DB diretto |

## Bounded context (sottocartelle dentro Domain/Application/Infrastructure)

- **Projects** — `Project` (aggregate), `Allocation` (entity child), `ProjectStatus`, calcoli derivati.
- **Customers** — `Customer` (aggregate).
- **Workforce** — `Figure` (aggregate o entity con catalogo statico A→F), `Employee` (aggregate).
- **Identity** — `User`, `UserRole` (enum: `Admin`, `Manager`, `Presales`, `ProjectManager`).
- **Alerting** — `AlertRule` (enum strategie), `AlertInstance`, `AlertSeverity`.

## Regole di dominio (NON negoziabili)

1. **Aggregate root protegge gli invariant**: mai stati invalidi. Niente setter pubblici;
   le mutazioni passano da metodi intenzionali (`AggiungiAllocazione`, `RegistraConsuntivo`,
   `CambiaStato`, ecc.).
2. **Value Object immutabili** per concetti senza identità: `Money`, `Hours`, `ProjectCode`,
   `Percentage`. Implementarli come `readonly record struct` o `sealed record`.
3. **Eccezioni di dominio custom**: `DomainException` base + sottoclassi
   (`InvalidProjectStateException`, ecc.). Mai `throw new Exception(...)` generico.
4. **Niente `DateTime.Now`** nel dominio: ricevi un `IClock` se serve "ora".
5. **Niente dipendenze esterne** in Domain (no EF, no Newtonsoft, no MediatR). Solo BCL.

## Use case (Application)

- Pattern CQRS-lite: classi `XxxCommand` / `XxxQuery` + handler dedicato, senza obbligo di MediatR.
  Una static class `XxxHandler` con metodo `HandleAsync(...)` è accettabile per l'MVP.
- DTO sempre `record` immutabili in `Application/<Context>/Dtos/`.
- Validazione input con FluentValidation prima di toccare l'aggregate.
- I calcoli derivati (write-up, forecast, margine) stanno in **Application**, non in Domain
  (dipendono da `IClock` e da listini esterni alla regola di consistenza dell'aggregate).

## Autorizzazione (mock)

- `ICurrentUser` esposto da Api → consumato da Application per filtri.
- Middleware in Api legge header `X-User-Id`, carica `User` da DB, popola `ICurrentUser`
  (id, ruolo, employeeId opzionale).
- **Filtri per ruolo** applicati in Application (non nei controller):
  - `Admin` / `Manager` → vedono / modificano tutto.
  - `ProjectManager` → vede solo progetti con `PmId == currentUser.Id`. Può modificare
    SOLO il campo `OreConsuntivate` delle proprie allocazioni.
  - `Presales` → vede solo progetti con `PresalesId == currentUser.Id`. Read-only.
- Endpoint di scrittura su `Project` accettati solo per `Admin`/`Manager` (eccetto
  l'endpoint dedicato `PATCH /api/progetti/{id}/allocazioni/{allocId}/consuntivo` aperto al PM
  proprietario).

## EF Core

- Una `IEntityTypeConfiguration<T>` per ogni aggregate root, in
  `Infrastructure/Persistence/Configurations/`.
- Value object mappati con `OwnsOne` / `HasConversion`.
- Repository per aggregate root, mai per entity child.
- Migrations: `dotnet ef migrations add <Nome> --project ManAgent.Infrastructure --startup-project ManAgent.Api`.
- Seed: `SeedData.EnsureSeededAsync(dbContext)` chiamato in `Program.cs` se `app.Environment.IsDevelopment()`.

## Minimal API (in Api)

- Endpoints raggruppati per bounded context: `Endpoints/ProgettiEndpoints.cs`,
  `Endpoints/ClientiEndpoints.cs`, ecc. Ognuno espone `MapXxx(this IEndpointRouteBuilder app)`.
- Endpoint thin: validano input, invocano handler Application, ritornano `Results.Ok/NotFound/BadRequest`.
- Path **in italiano**: `/api/progetti`, `/api/clienti`, `/api/dipendenti`, `/api/figure`,
  `/api/utenti`, `/api/alerts`, `/api/dashboard/kpi`.
- Swagger abilitato in Development, configurato per inviare header `X-User-Id`.

## Test (xUnit)

- Progetto `ManAgent.Domain.Tests` (almeno). Coprire:
  - Invariant aggregate (`Project` rifiuta budget ≤ 0, transizione stato invalida, ecc.).
  - Calcolo write-up su scenario noto (`AlertEvaluator` o servizio calcolo KPI).
- Naming: `MetodoSottotest_QuandoCondizione_AlloraRisultato()`.

## Naming

| Cosa | Esempio |
| --- | --- |
| Aggregate root | `Project.cs`, `Customer.cs`, `Employee.cs` |
| Entity child | `Allocation.cs` |
| Value object | `Money.cs`, `Hours.cs`, `ProjectCode.cs` |
| Enum | `ProjectStatus.cs`, `UserRole.cs`, `AlertSeverity.cs` |
| Command/Query | `CreateProjectCommand.cs`, `GetProjectsByRoleQuery.cs` |
| DTO | `ProjectDto.cs`, `ProjectListItemDto.cs` |
| EF Configuration | `ProjectConfiguration.cs` |
| Endpoint module | `ProgettiEndpoints.cs` |
| Test | `ProjectTests.cs`, `AlertEvaluatorTests.cs` |

## Anti-pattern da rifiutare

- Setter pubblici su entity (`project.Budget = ...`).
- `DateTime.Now` / `DateTime.UtcNow` direttamente in regole di business.
- Try/catch generici che mascherano `DomainException`.
- Query EF nel controller / minimal API.
- DTO mutable (class con set pubblici).
- Logica di filtro per ruolo duplicata in più punti (centralizzala in Application).
- Aggiungere feature fuori scope MVP senza richiesta esplicita.

## Dopo ogni modifica

1. `dotnet build` → 0 warning.
2. `dotnet test` → tutti verdi.
3. Aggiorna `docs/domain-model.md` se hai cambiato aggregate/invariants.
4. Aggiorna `docs/project-context.md` se hai cambiato comportamento utente o regole alert.
