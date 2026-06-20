# Man-Agent

Piattaforma SaaS enterprise per la gestione e ottimizzazione di progetti per cliente,
con focus su efficienza economica (write-up vs write-off) e alerting proattivo.

> MVP da realizzare in ~5 ore. Dati mockati ma realistici. Single-tenant.

## Stack

- **Backend**: .NET 10, C#, DDD (Domain / Application / Infrastructure / Api), EF Core, minimal API
- **Frontend**: React 18 + TypeScript + Vite, Ant Design, CSS Modules, TanStack Query, Zustand, Axios, Recharts
- **Database**: Azure SQL (LocalDB / SQL Express in dev)
- **Infra**: Azure Static Web App + App Service Linux + Azure SQL + Storage Account, via Terraform
- **Auth**: mock (dropdown utente + header `X-User-Id`)

## Documentazione

Leggere **prima** di lavorare nel repo:

1. [AGENTS.md](AGENTS.md) — regole operative per agenti/sviluppatori
2. [docs/project-context.md](docs/project-context.md) — scope, glossario, ruoli, regole alert, decisioni MVP
3. [docs/guidelines.md](docs/guidelines.md) — coding standards backend + frontend
4. [docs/architecture.md](docs/architecture.md) — layer, bounded context, deploy
5. [docs/domain-model.md](docs/domain-model.md) — aggregate, invariants, ER

Skill per VS Code Copilot:
- [`.github/skills/backend-ddd/SKILL.md`](.github/skills/backend-ddd/SKILL.md)
- [`.github/skills/frontend-react/SKILL.md`](.github/skills/frontend-react/SKILL.md)

## Layout

```
Man-Agent/
├── AGENTS.md
├── README.md
├── docs/
├── .github/skills/
├── src/
│   ├── backend/       (.NET 10 solution, da creare in Fase 2)
│   └── frontend/      (Vite + React + TS, da creare in Fase 2)
└── infra/         (Terraform, da creare in Fase 2)
```

## Prerequisiti

- .NET SDK 10
- Node.js LTS (≥ 20) + npm
- SQL Server LocalDB *oppure* SQL Server Express (Windows) / SQL Server in Docker (cross-platform)
- (Opzionale per IaC) Terraform ≥ 1.7 + Azure CLI

## Setup locale (dopo Fase 2)

### Backend
```pwsh
cd src/backend
dotnet restore
dotnet ef database update --project ManAgent.Infrastructure --startup-project ManAgent.Api
dotnet run --project ManAgent.Api
# Swagger: https://localhost:5001/swagger
```

### Frontend
```pwsh
cd src/frontend
npm install
npm run dev
# Dev server: http://localhost:5173 (proxy /api -> backend)
```

### Login demo
Apri http://localhost:5173/login e seleziona un utente dal dropdown. Ogni utente ha
un ruolo diverso (Admin, Manager, Presales, Project Manager 1, Project Manager 2)
per dimostrare lo scope filtrato.

## Stato attuale

- [x] **Fase 1** — Foundation docs + skill
- [x] **Fase 2** — Scaffolding backend + frontend + Terraform
- [ ] **Fase 3** — Dominio + persistenza + seed
- [ ] **Fase 4** — API + autorizzazione mock
- [x] **Fase 5 (frontend)** — Frontend completo con dati mockati (tutte le pagine)
- [ ] **Fase 6** — Polish + sync docs + IaC finale
