# Guidelines — TeamFit

> Documento vivo. Aggiungere qui ogni nuova convenzione decisa durante il build.

## 1. Principi generali

1. **Semplicità prima**. MVP da 5h: nessuna astrazione non necessaria.
2. **Documenti vivi**. Dopo ogni feature → aggiorna `project-context.md` (e questo file se introduci una convenzione).
3. **Lingua**: UI in italiano; codice (identificatori, commenti, log) in inglese.
4. **Commenti minimi**: solo dove il _perché_ non è ovvio. Mai documentare cosa fa il codice.

## 2. Backend (.NET 10 / C#)

### Stile
- `nullable` enabled, `ImplicitUsings` enabled, warning trattati come errori per i livelli `Domain`/`Application`.
- Async ovunque su I/O: nome metodo `XxxAsync`, restituisce `Task` / `ValueTask`. Mai `.Result` / `.Wait()`.
- Prefer expression-bodied members per metodi corti.
- `record` per DTO; `sealed record` per VO; `class` per aggregate/entity (con costruttore privato + factory `Create`).
- Niente `using static` se non per `Math`.

### Dominio
- Costruttori di aggregate `private`; istanziazione via factory statica `Create(...)` che valida invariants.
- Eccezioni di dominio: `DomainException` base in `Domain/Shared/Exceptions/`. Sottotipi per regola.
- Tempo: `IClock` in `Application/Abstractions/IClock.cs`. Implementazione `SystemClock` in `Infrastructure/Time/`.
- Validazione input applicativo: FluentValidation in `Application/<Context>/Validators/`.

### EF Core
- Una `IEntityTypeConfiguration<T>` per aggregate root in `Infrastructure/Persistence/Configurations/`.
- Value object → `OwnsOne` o `HasConversion`.
- Lazy loading disabilitato. Caricamento esplicito con `Include`.
- `AsNoTracking()` per tutte le query di sola lettura.

### Api (Minimal API)
- Endpoint thin: validano input (FluentValidation in Application) e chiamano handler.
- `RequireAuthorization` non usato (auth mock); filtro ruolo applicato a mano in Application via `ICurrentUser`.
- Path in italiano, segment lowercase: `/api/progetti`, `/api/clienti`.
- Risposte: `Results.Ok(dto)`, `Results.NotFound()`, `Results.BadRequest(new { error = "..."} )`.
- Swagger configurato con security header `X-User-Id` editabile.

### Test
- `xUnit`. Project di test: `TeamFit.Domain.Tests` (almeno). Opzionale `TeamFit.Application.Tests`.
- `FluentAssertions` per leggibilità.
- Test naming: `Metodo_QuandoCondizione_AlloraRisultato`.

## 3. Frontend (React + TypeScript + Vite)

### Stile TS
- `tsconfig` con `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`.
- Zero `any`. Usa `unknown` + narrowing se necessario.
- Funzioni esportate sempre con return type esplicito (lascia inferenza per quelle locali).
- File `.tsx` per componenti, `.ts` per hook/servizi/store/types.

### React
- **Componenti funzionali** + hook. Nessuna class component.
- Props tipizzate con `interface XxxProps { ... }`.
- `useEffect` solo per side effect veri (subscribe, scroll restore). **Non per fetch**: usa TanStack Query.
- `useMemo`/`useCallback` solo se profilato un problema, non a tappeto.

### Stili
- **CSS Modules** (`Componente.module.css`). Import: `import styles from './X.module.css'`.
- **Mai** `style={{...}}` inline (eccezione tollerata: dimensioni veramente dinamiche calcolate a runtime).
- Variabili colori in `styles/global.css` come CSS custom properties (`--tf-color-warning`, ecc.).
- Tema Ant Design centralizzato in `styles/theme.ts`.

### State
- **Server state** → TanStack Query. Chiave standard: `['<entity>']` o `['<entity>', id]`.
- **Client/UI state globale** → Zustand. Un solo store per dominio (`authStore`).
- **State locale** → `useState`. Niente Redux.

### API
- Una sola istanza Axios in `services/api/apiClient.ts`. Interceptor inietta `X-User-Id`.
- File `xxxApi.ts` per ciascun gruppo di endpoint. Funzioni esportano DTO tipizzati.

### Componenti
- Lunghezza massima ~200 righe. Oltre → estrai sub-componenti in `features/<feature>/`.
- Niente business logic: numeri pre-calcolati dal backend.
- Label e messaggi sempre in italiano (anche errori utente).

## 4. Naming

| Layer | Convenzione |
| --- | --- |
| C# class/record/enum | `PascalCase` |
| C# campo privato | `_camelCase` |
| C# parametro/locale | `camelCase` |
| TS componente / tipo | `PascalCase` |
| TS funzione / variabile / hook | `camelCase` (hook: prefisso `use`) |
| File componente | `PascalCase.tsx` + `PascalCase.module.css` |
| File hook / service / store | `camelCase.ts` |
| Endpoint route | `/api/<contesto-italiano>` lowercase |
| Tabella SQL | singolare PascalCase (`Project`, `Allocation`) |

## 5. Git & commit

- Branch principale: `main`. Per il MVP si committa direttamente in `main`.
- **Conventional Commits**: `<tipo>(<scope>): <descrizione>` in inglese.
  - tipo: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
  - scope: `projects`, `customers`, `workforce`, `identity`, `alerting`, `frontend`, `infra`, `docs`
- Un commit per feature funzionante (build verde end-to-end).
- Esempi:
  - `feat(projects): add aggregate root with budget invariants`
  - `feat(frontend): projects table with role-based filters`
  - `docs(context): update KPI definitions`

## 6. Sicurezza (anche se MVP mock)

- Validare sempre input lato server (FluentValidation). Lato frontend è solo UX.
- Niente segreti in repo. Connection string in `appsettings.Development.json` solo per LocalDB.
- CORS aperto solo a `http://localhost:5173` in dev e all'hostname Static Web App in prod (predisposto).
- SQL injection non possibile: usiamo EF Core LINQ, mai SQL raw concatenato.

## 7. Performance (MVP-grade)

- Backend: `AsNoTracking()` su tutte le query di sola lettura.
- Frontend: TanStack Query gestisce caching. Default `staleTime: 30_000`.
- Bundle: Vite default + code-splitting automatico per route via React Router lazy.

## 8. Aggiornamento di queste guidelines

Se durante l'implementazione introduci una convenzione nuova (es. pattern di error
handling, naming aggiuntivo, libreria nuova) → **aggiungi una sezione qui** nello
stesso commit della feature. La regola d'oro è: chi legge questo file deve poter
scrivere codice conforme senza chiedere a nessuno.

## 9. Stime infrastrutturali

- Le stime Terraform in `docs/infra-design.md` indicano sempre figura professionale usata, baseline e assunzioni.
- Per stime enterprise usare **AGIC Figura F** se non indicato diversamente.
- Separare sempre `validate/plan` da `apply/debug/smoke test`.
- Il Terraform POC in `infra/terraform/` deve restare plan-safe: niente segreti hard-coded, password generate da provider `random`, secret Key Vault non gestiti di default e output sensibili marcati `sensitive`.
- Static Web App Free non supporta linked backend: mantenere CORS diretto come default; abilitare il linked backend solo con SKU Standard.
- Non gestire secret Key Vault dal runner locale quando il vault è privato. Usare `manage_key_vault_secrets = false` come default; abilitare solo da runner con accesso alla VNet/private DNS.
- Non condividere `plan.out`: può contenere valori sensibili se si abilita gestione secret o si passa `api_app_settings`.

## 10. Servizi AI Azure

- Azure OpenAI deve essere gestito tramite Azure AI Foundry.
- POC: endpoint pubblico ammesso per contenere costo e complessità; accesso solo dal backend via managed identity/RBAC. Enterprise: public network access disabilitato, Private Endpoint + Private DNS obbligatori.
- I costi Azure OpenAI sono sempre indicati separatamente dal costo infrastrutturale fisso perché dipendono da modello e token.
