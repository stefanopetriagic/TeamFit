# AGENTS.md — TeamFit

Guida operativa per agenti AI (e umani) che lavorano su questo repository.
Leggere **prima** di qualunque modifica.

---

## Cos'è TeamFit

Piattaforma SaaS enterprise per la **gestione e ottimizzazione dei progetti** che
un'azienda eroga ai propri clienti. Focus: **efficienza economica** (write-up vs
write-off) e **alerting proattivo** sui rischi di inefficienza.

- **Backend**: .NET 10, C#, architettura DDD (Domain / Application / Infrastructure / Api)
- **Frontend**: React + TypeScript + Vite, Ant Design + CSS Modules (**mai CSS inline**)
- **DB**: Azure SQL (LocalDB / SQL Express in dev) via EF Core
- **Infra**: POC low-cost networked con Static Web App Free + App Service B1 Linux + Azure SQL Free/Basic + Storage Account + Private Endpoint + Azure OpenAI via Azure AI Foundry privato; Enterprise con App Gateway WAF_v2, App Service privati, VM Agent, Cosmos DB, Key Vault, Azure OpenAI via Azure AI Foundry privato, Private Endpoint, Private DNS, Log Analytics e Application Insights
- **IaC**: Terraform (in `infra/terraform/`)
- **Auth**: mock (dropdown utenti + header `X-User-Id`), no Entra ID nell'MVP
- **Tenancy**: single-tenant
- **Lingua UI**: Italiano

Vincolo: **MVP da realizzare in ~5 ore**. Dati mockati ma realistici.

---

## Regole d'oro per agenti (NON negoziabili)

1. **Documenti vivi**. Dopo *qualsiasi* feature o cambio user-visible aggiorna
   [docs/project-context.md](docs/project-context.md) e
   [docs/guidelines.md](docs/guidelines.md). Aggiornare il `docs/architecture.md`
   e `docs/domain-model.md` se cambia il modello o il deploy.
2. **Mai CSS inline** (`style={{...}}`) nel frontend. Usa **CSS Modules**
   (`Componente.module.css` accanto al componente).
3. **Mai logica di business nei controller** del backend. La logica vive negli
   aggregate (Domain) o nei use case (Application).
4. **No setter pubblici** sulle entità di dominio: mutazioni solo via metodi
   intenzionali che proteggono gli invariant.
5. **No `DateTime.Now`** diretto: usa l'astrazione `IClock` (testabilità).
6. **TypeScript strict**: zero `any`. Props sempre tipizzate.
7. **Lingua**: tutti i testi UI in italiano; commenti e identificatori in inglese.
8. **Out-of-scope MVP**: timesheet, pipeline Presales, export Excel/PDF, email
   reali, audit log, multi-tenant, deploy effettivo Azure, auth reale. Non
   aggiungere queste feature senza richiesta esplicita.
9. **Setup Wizard obbligatorio** al primo accesso: guard `RequireConfig` in `App.tsx`. Non
   saltare il wizard senza richiesta esplicita.
10. **AI Chatbot** è un componente mock: tutte le risposte sono deterministiche (keyword matching).
    Il pattern di integrazione Azure AI Foundry reale va implementato backend-side, non nel mock.

---

## Mappa documenti

| File | Quando leggerlo |
| --- | --- |
| [AGENTS.md](AGENTS.md) | Sempre, prima di iniziare. |
| [docs/project-context.md](docs/project-context.md) | Scope, glossario, ruoli, regole di alerting, decisioni MVP. |
| [docs/guidelines.md](docs/guidelines.md) | Coding standards backend + frontend, naming, commit. |
| [docs/architecture.md](docs/architecture.md) | Bounded context, layer, topologia deploy. |
| [docs/domain-model.md](docs/domain-model.md) | Aggregate, entity, invariants, mini-ER. |
| [README.md](README.md) | Setup locale, comandi rapidi. |

---

## Skill da usare

VS Code Copilot trova automaticamente le skill in `.github/skills/`. Quando lavori in:

- **`src/backend/`** → segui [`.github/skills/backend-ddd/SKILL.md`](.github/skills/backend-ddd/SKILL.md)
- **`src/frontend/`** → segui [`.github/skills/frontend-react/SKILL.md`](.github/skills/frontend-react/SKILL.md)

> **Stato attuale**: frontend completo con dati mockati (Fase 5 ✅ + PoC wizard + AI chatbot). Backend ancora da scaffoldare (Fase 2–4).
- **Analisi funzionale (.docx)** → segui [`.github/skills/functional-analysis-doc/SKILL.md`](.github/skills/functional-analysis-doc/SKILL.md)
- **Presentazione progetto (.pptx)** → segui [`.github/skills/project-presentation-ppt/SKILL.md`](.github/skills/project-presentation-ppt/SKILL.md)

Se modifichi entrambi nello stesso task, applica entrambe le skill ai rispettivi file.

---

## Layout repository

```
TeamFit/
├── AGENTS.md                          ← questo file
├── README.md
├── .github/
│   └── skills/
│       ├── backend-ddd/SKILL.md
│       ├── frontend-react/SKILL.md
│       ├── functional-analysis-doc/SKILL.md
│       └── project-presentation-ppt/SKILL.md
├── docs/
│   ├── project-context.md
│   ├── guidelines.md
│   ├── architecture.md
│   ├── domain-model.md
│   ├── analisi-funzionale/         ← output .docx (creata al primo uso)
│   └── presentazioni/              ← output .pptx (creata al primo uso)
├── backend/
│   ├── TeamFit.sln
│   ├── TeamFit.Domain/               ← entity, aggregate, VO, eventi, no deps esterne
│   ├── TeamFit.Application/          ← use case, DTO, interfacce, AlertEvaluator
│   ├── TeamFit.Infrastructure/       ← EF Core DbContext, repository, seed
│   └── TeamFit.Api/                  ← minimal API, middleware, Swagger
├── frontend/
│   └── src/
│       ├── pages/                     ← una pagina per route
│       ├── components/                ← componenti riutilizzabili
│       ├── features/                  ← componenti feature-specific
│       ├── services/api/              ← axios + endpoint
│       ├── hooks/                     ← custom hooks (TanStack Query wrappers)
│       ├── store/                     ← Zustand stores
│       ├── types/                     ← tipi TS condivisi
│       └── styles/                    ← global.css, theme.ts
└── infra/
    └── terraform/                     ← main.tf, variables.tf, outputs.tf
```

---

## Comandi standard

### Backend
```pwsh
cd src/backend
dotnet restore
dotnet build
dotnet test
dotnet ef database update --project TeamFit.Infrastructure --startup-project TeamFit.Api
dotnet run --project TeamFit.Api
```

### Frontend
```pwsh
cd src/frontend
npm install
npm run dev          # http://localhost:5173, proxy a backend su :5000
npm run build
npm run lint
```

### Infra (no apply nell'MVP)
```pwsh
cd infra/terraform
terraform init
terraform validate
terraform plan -out=plan.out
```

---

## Workflow consigliato per nuova feature

1. Apri il todo list / piano corrente.
2. Identifica il bounded context coinvolto (Projects / Customers / Workforce / Identity / Alerting).
3. Backend: Domain → Application → Infrastructure → Api (in quest'ordine).
4. Frontend: types → service api → hook → componente → pagina.
5. Test: almeno 1 test xUnit per ogni invariante / regola dominio nuova.
6. Aggiorna `docs/project-context.md` (se cambia comportamento utente) e
   `docs/guidelines.md` (se introduci una nuova convenzione).
7. Commit convenzionale: `feat(projects): aggiunto calcolo write-up`.

---

## Convenzioni di commit

`<tipo>(<scope>): <descrizione breve>` — tipo ∈ {feat, fix, chore, docs, refactor, test, style}.
Scope ∈ {projects, customers, workforce, identity, alerting, frontend, infra, docs}.

Esempio: `feat(alerting): regola forecast > budget`
