# Project Context — Man-Agent

> Documento vivo. **Aggiornare dopo ogni feature o cambio user-visible.**

## 1. Scope

**Man-Agent** è una piattaforma SaaS rivendibile alle aziende per la **gestione e
ottimizzazione dei progetti** erogati ai loro clienti. Il focus è **l'efficienza
economica**: ogni progetto deve restare in **write-up** (margine positivo) ed
evitare il **write-off** (margine negativo o budget sforato).

### A chi si vende
Aziende di servizi (es. consulenza tech) con:
- più clienti attivi contemporaneamente
- portafoglio progetti a budget
- personale strutturato in figure professionali con costi orari differenti
- bisogno di visibilità tempestiva sui progetti a rischio

### Problema risolto
Project Manager e Manager scoprono troppo tardi quando un progetto sta bruciando
budget. Man-Agent dà visibilità in tempo reale su consumo, forecast e margine, e
alza alert prima che il danno sia fatto.

## 2. Glossario

| Termine | Definizione |
| --- | --- |
| **Cliente** | Azienda finale per cui si eroga uno o più progetti. |
| **Progetto** | Iniziativa erogata a un cliente, con budget €, budget ore, date, PM, Presales opzionale. |
| **Figura professionale** | Livello di seniority/competenza (A → F). Ogni figura ha un costo orario interno e una tariffa di vendita oraria. |
| **Dipendente** | Persona dell'azienda assegnata a una figura. |
| **Allocazione** | Riga di pianificazione di un dipendente (o di una figura) su un progetto, con ore allocate e ore consuntivate. |
| **Consuntivo** | Ore effettivamente lavorate, registrate sull'allocazione. |
| **Ricavo riconosciuto** | `OreConsuntivate × TariffaVenditaFigura`. |
| **Costo sostenuto** | `OreConsuntivate × CostoOrarioFigura`. |
| **Write-up** | `RicavoRiconosciuto − CostoSostenuto` > 0. Margine positivo a oggi. |
| **Write-off** | `RicavoRiconosciuto − CostoSostenuto` < 0. Margine negativo o budget sforato. |
| **Forecast a finire (EAC)** | Costo previsto a chiusura progetto stimato proporzionando il consumo attuale. |
| **Margine %** | `(RicavoRiconosciuto − CostoSostenuto) / RicavoRiconosciuto`. |
| **Alert** | Notifica in-app emessa quando una regola di rischio si verifica per un progetto. |

## 3. Definizione operativa dei KPI

Per progetto, calcolati in `Application` (non in Domain):

- `RicavoRiconosciutoAttuale = Σ(allocazione.OreConsuntivate × allocazione.Figure.TariffaVenditaOraria)`
- `CostoSostenutoAttuale = Σ(allocazione.OreConsuntivate × allocazione.Figure.CostoOrario)`
- `WriteUp = RicavoRiconosciutoAttuale − CostoSostenutoAttuale`
- `BudgetConsumatoPct = CostoSostenutoAttuale / BudgetEuro`
- `ForecastAFinireCost = CostoSostenutoAttuale / OreConsuntivateTot × OreAllocateTot` (se `OreConsuntivateTot > 0`, altrimenti `0`)
- `MarginePct = WriteUp / RicavoRiconosciutoAttuale` (se ricavo > 0)

A livello dashboard, gli stessi KPI sono aggregati per ruolo (scope filtrato).

## 4. Ruoli & visibilità

| Ruolo | Vede | Crea/Modifica progetti | Modifica consuntivi |
| --- | --- | --- | --- |
| **ADMIN** | Tutto | Sì | Sì (qualsiasi progetto) |
| **MANAGER** | Tutto | Sì | Sì (qualsiasi progetto) |
| **PROJECT_MANAGER** | Solo i progetti dove `PmId == self.id` | No | Sì, **solo `OreConsuntivate`** sulle allocazioni dei propri progetti |
| **PRESALES** | Solo i progetti dove `PresalesId == self.id` | No | No (read-only) |

Auth: **mock** via dropdown utenti + header `X-User-Id`. Niente JWT, niente Entra ID nell'MVP.

## 5. Regole di alerting (motore)

Valutate on-demand su tutti i progetti `Active`. Ogni regola produce 0..1 `AlertInstance` per progetto.

| Codice | Regola | Severity |
| --- | --- | --- |
| `BUDGET_WARN` | `BudgetConsumatoPct ≥ 70%` e `< 90%` | `Warning` |
| `BUDGET_CRIT` | `BudgetConsumatoPct ≥ 90%` | `Critical` |
| `FORECAST_OVER` | `ForecastAFinireCost > BudgetEuro` | `Critical` |
| `MARGIN_LOW` | `MarginePct < 15%` (con ricavo > 0) | `Warning` |
| `OVERRUN_ALLOC` | Esiste allocazione con `OreConsuntivate > OreAllocate` | `Warning` |
| `NO_ACTIVITY` | `UltimaModificaConsuntivi` più vecchia di **14 giorni** (soglia fissa MVP) | `Warning` |

Recapito: **solo in-app** (badge in header + pagina `/alerts`).

## 6. Modello dati di alto livello (per dettagli vedi [domain-model.md](domain-model.md))

- **Customers**: `Customer` (id, ragioneSociale, codice, contatti opzionali).
- **Workforce**: `Figure` (codice A→F, nome, costoOrario, tariffaVenditaOraria), `Employee` (id, nome, cognome, figureCode).
- **Identity**: `User` (id, nome, email, role, employeeId nullable).
- **Projects**: `Project` (id, code, name, customerId, pmId, presalesId nullable, status, dataInizio, dataFine, budgetEuro, budgetOre, tariffaVenditaMedia, note, ultimaModificaConsuntivi), `Allocation` (id, projectId, employeeId, figureCode, oreAllocate, oreConsuntivate).
- **Alerting**: `AlertInstance` (id, projectId, ruleCode, severity, message, raisedAt) — generate in memoria dall'`AlertEvaluator`, persistite opzionalmente.

## 7. Decisioni MVP (confermate)

1. **Single-tenant** (nessun `TenantId` sulle entità).
2. **4 ruoli**: ADMIN, MANAGER, PRESALES, PROJECT_MANAGER. No TEAM_MEMBER, no FINANCE.
3. **Solo ADMIN/MANAGER creano progetti**. PM modifica solo `OreConsuntivate` sui propri.
4. **Auth mock** con dropdown utenti + `X-User-Id`.
5. **Budget**: sia € sia ore totali, tracciati separatamente.
6. **Figure A→F** con costo/tariffa orari fissi per figura (override per-dipendente fuori scope MVP).
7. **Write-up = Ricavo riconosciuto − Costo sostenuto** (entrambi calcolati su consuntivo a oggi).
8. **Consuntivi**: campo `OreConsuntivate` editabile inline sull'allocazione. **Niente timesheet giornaliero.**
9. **6 regole alerting** elencate sopra, recapito solo in-app.
10. **`PresalesId`** è un campo nullable su `Project` (richiesto per supportare la vista Presales).
11. **Soglia "no attività"** = 14 giorni, fissa nel codice MVP.
12. **Persistenza**: EF Core + Azure SQL (LocalDB / SQL Express in dev), migrations + seed.
13. **UI library**: Ant Design + CSS Modules. **No Tailwind**, **no CSS inline**.
14. **Recharts** per i grafici dashboard.
15. **IaC**: Terraform per Static Web App + App Service + Azure SQL + Storage Account. Nelle 5h solo `terraform validate` + `plan`, **no apply**.
16. **Seed**: 3 clienti, 8 progetti (mix stati, almeno 2 con alert), 15 dipendenti, 5 utenti (uno per ruolo + un secondo PM).
17. **Lingua UI**: italiano.

## 10. Funzionalità PoC aggiunte (2026-06-20)

### Setup Wizard (`/configurazione`)
- Richiesto al primo accesso (guard `RequireConfig` in `App.tsx`)
- 5 step: Organizzazione → Figure professionali → Risorse umane → Importazione Excel → Sync DevOps (opzionale)
- Step Excel: download template CSV + upload con anteprima
- Step DevOps: mock sync con Azure DevOps (URL + PAT), importa 5 progetti e 4 utenti simulati
- Store: `useOrgConfigStore` (Zustand + persist), tipo `OrgConfig` in `src/types/orgConfig.ts`
- Accessibile anche via menu utente "Riconfigura organizzazione"

### AI Chatbot (pannello destro)
- Toggled dal pulsante "AI Agent" in fondo alla sidebar sinistra
- Pannello collassabile 360px sulla destra, si apre sopra il contenuto principale
- Label: **Man-Agent AI** | Azure AI Foundry · GPT-4o
- Mock response engine: riconosce keyword (sovraccarico, proponi, rischio, budget, risorse, portfolio, help)
- Propone riallocazioni come card interattive con Accept/Reject
- Non richiede backend; tutte le risposte sono mock deterministici

### Dashboard rinforzata
- Rimossi grafici AreaChart e PieChart (rumore visivo)
- Banner rosso se ci sono risorse in sovraccarico critico
- Sezione "Carico risorse" con Progress bar colorata per stato (ok/warning/critical)
- Righe di tabella colorate per criticità (rosso/giallo)
- KPI grid mantenuta, semplificate le label

### Workload
- Funzione `calcEmployeeWorkload()` in `mocks/data.ts`
- `EmployeeWorkload` type esportato
- Soglie: `critical ≥ 650h`, `warning ≥ 450h`, `ok < 450h` — ore totali allocate su progetti Attivi



Non implementare senza richiesta esplicita:
- Timesheet giornaliero / settimanale
- Pipeline opportunità Presales (pre-progetto)
- Export Excel / PDF
- Notifiche email o Teams reali
- Audit log / cronologia modifiche
- Multi-tenant
- Deploy effettivo su Azure
- Auth reale (Entra ID, ASP.NET Identity)
- Localizzazione multi-lingua
- Override costo orario per singolo dipendente

## 9. Storia decisioni

| Data | Decisione | Motivazione |
| --- | --- | --- |
| 2026-06-20 | Inizio progetto, scope MVP confermato | Sessione di discovery iniziale con utente. |
| 2026-06-20 | Tailwind escluso a favore di Ant Design + CSS Modules | Conflitti reset/utility, overhead non giustificato nelle 5h. |
| 2026-06-20 | PM può modificare solo `OreConsuntivate` sui suoi progetti | Necessario per generare alert realistici durante la demo. |
| 2026-06-20 | `PresalesId` nullable su `Project` | Serve a filtrare la vista Presales senza creare entità separata. |
| 2026-06-20 | Frontend scaffolded con dati mockati (no backend) | Primo ciclo: UI enterprise completa su mock data; backend sviluppato in seguito. |
| 2026-06-20 | Light/dark theme tramite `useThemeStore` (Zustand) + `antd darkAlgorithm` | Requisito enterprise; switch nella header; preferenza persistita in localStorage. |
| 2026-06-20 | KPI calcolati in `src/mocks/data.ts#calcKpi` lato client | Simulazione realistica del calcolo backend; stessa formula che userà Application layer. |
| 2026-06-20 | Soglia "no attività" fissa a 14 giorni | Configurabilità rimandata post-MVP. |
| 2026-06-20 | **Setup Wizard** aggiunto (5 step): org name, figure professionali, risorse manuali, importazione Excel, sync DevOps (opzionale). | Onboarding guidato; l'app richiede completamento wizard prima di accedere. |
| 2026-06-20 | **AI Chatbot** (right panel) alimentato da mock Azure AI Foundry. Propone riallocazioni, analizza carichi, identifica rischi. | PoC per integrazione Azure AI Foundry Agents. |
| 2026-06-20 | Dashboard refactored: rimossi grafici (AreaChart, PieChart), aggiunta sezione "Carico risorse" con highlight overloaded employees. | Riduzione rumore visivo; focus su insight operativi immediati. |
| 2026-06-20 | `calcEmployeeWorkload()` aggiunto in `mocks/data.ts`. Soglie: critical ≥650h, warning ≥450h. | KPI workload necessario per la sezione overload in dashboard e chatbot. |

