---
name: frontend-react
description: Regole per il frontend React + TypeScript + Vite di TeamFit. USE WHEN si lavora in frontend/, si creano o modificano pagine, componenti, hook, servizi API, store Zustand, query TanStack, stili. Triggers - React, TypeScript, TSX, Vite, frontend, pagina, componente, hook, store, axios, TanStack Query, Zustand, Ant Design, antd, CSS Modules, Recharts, dashboard, tabella, form, login, route, RoleGuard.
---

# Frontend React — TeamFit

Frontend SPA in React + TypeScript + Vite. Leggi sempre
[AGENTS.md](../../../AGENTS.md) e [docs/guidelines.md](../../../docs/guidelines.md)
prima di modificare codice.

## Stack

- **Build**: Vite
- **Linguaggio**: TypeScript (strict)
- **Routing**: React Router v6
- **Server state**: TanStack Query (`@tanstack/react-query`)
- **Client state**: Zustand (solo UI state globale: utente loggato, eventuale tema)
- **HTTP**: Axios (singolo `apiClient` con interceptor)
- **UI library**: Ant Design (`antd`)
- **CSS**: **CSS Modules** (`Componente.module.css`). **Mai `style={{...}}` inline.**
- **Charts**: Recharts

> **Niente Tailwind**: confligge con Ant Design e introduce overhead non giustificato nell'MVP.

## Struttura cartelle (`frontend/src/`)

```
src/
├── pages/              ← una pagina per route (LoginPage.tsx, DashboardPage.tsx, ...)
├── components/         ← componenti riutilizzabili cross-feature (AppLayout, RoleGuard, KpiCard, BudgetProgress, SeverityTag)
├── features/           ← componenti / form / tabelle specifici di una feature (es. features/projects/ProjectForm.tsx)
├── services/api/       ← apiClient.ts + un file per endpoint (projectsApi.ts, customersApi.ts, ...)
├── hooks/              ← custom hook (wrapper TanStack Query: useProjects, useAlerts, ...)
├── store/              ← Zustand stores (authStore.ts)
├── types/              ← tipi TS condivisi (project.ts, user.ts, alert.ts)
└── styles/             ← global.css, theme.ts (Ant Design ConfigProvider theme)
```

## Regole d'oro (NON negoziabili)

1. **Mai CSS inline**. Sempre un file `<Nome>.module.css` accanto al componente.
   Eccezione tollerata: prop `style` di Ant Design per dimensioni dinamiche **calcolate**
   (es. larghezza colonna), ma preferisci comunque una classe.
2. **TypeScript strict**: zero `any`. Se davvero serve, usa `unknown` e fai narrowing.
3. **Props sempre tipizzate** con `interface XxxProps { ... }`.
4. **Server state in TanStack Query**, mai duplicarlo in Zustand. Zustand SOLO per
   `currentUser` (e UI state che persiste tra route).
5. **Tutte le chiamate HTTP passano da `services/api/`**. Mai `fetch`/`axios` diretto
   nei componenti.
6. **Componenti < 200 righe**. Se cresci, estrai sub-componenti in `features/<feature>/`.
7. **Lingua UI**: italiano (label, messaggi, validazioni). Identificatori e commenti: inglese.
8. **No business logic** nei componenti: calcoli economici già forniti dal backend.

## API client

`services/api/apiClient.ts` espone una singola istanza Axios con:
- `baseURL` letto da `import.meta.env.VITE_API_BASE_URL` (default `/api` in dev, proxy Vite).
- Interceptor request che inietta header `X-User-Id` letto da `useAuthStore.getState().currentUser?.id`.
- Interceptor response che logga errori e propaga.

Ogni file `xxxApi.ts` esporta funzioni async che ritornano DTO tipizzati definiti in `src/types/`.

## Hook pattern (TanStack Query)

```ts
// src/hooks/useProjects.ts
export const projectsQueryKey = ['projects'] as const;

export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKey,
    queryFn: () => projectsApi.list(),
  });
}
```

Mutazioni: `useMutation` + `queryClient.invalidateQueries({ queryKey: projectsQueryKey })`.

## Auth & ruoli

- `useAuthStore` (Zustand): `{ currentUser, setCurrentUser, logout }` persiste in `localStorage`.
- `LoginPage` chiama `GET /api/utenti`, mostra dropdown Ant Design, su submit setta lo store
  e fa `navigate('/')`.
- `<RoleGuard roles={['Admin','Manager']}>` nasconde i children se l'utente corrente
  non ha uno dei ruoli ammessi. Usalo per bottoni "Nuovo progetto", colonne sensibili, ecc.
- Route protette: `App.tsx` reindirizza a `/login` se `!currentUser`.
- `RequireConfig` guard: reindirizza a `/configurazione` se `useOrgConfigStore().isConfigured === false`.

## Setup Wizard (`/configurazione`)

- File: `pages/SetupWizardPage.tsx` + `SetupWizardPage.module.css`
- 5 step con `antd Steps`: Organizzazione, Figure, Risorse, Importazione Excel, Sync DevOps (opzionale)
- Store: `useOrgConfigStore` (Zustand + persist) in `store/orgConfigStore.ts`
- Tipo config: `OrgConfig` in `types/orgConfig.ts`
- Il completamento del wizard chiama `saveConfig(config)` e fa `navigate('/')`.

## AI Chatbot

- File: `components/AIChatbot.tsx` + `AIChatbot.module.css`
- Store: `useChatStore` (Zustand) in `store/chatStore.ts`
- Pannello destro 360px collassabile (classe CSS `panel` / `panelOpen`)
- Toggle via pulsante "AI Agent" nella sidebar, o tramite `useChatStore().toggleOpen()`
- Mock response engine basato su keyword matching in `getMockResponse()`
- Proposta riallocazione: componente `ProposalCard` con Accept/Reject inline
- Label brand: "TeamFit AI · Azure AI Foundry · GPT-4o"

## Pagine MVP

| Route | File | Descrizione |
| --- | --- | --- |
| `/login` | `pages/LoginPage.tsx` | Dropdown utenti, set store, redirect. |
| `/configurazione` | `pages/SetupWizardPage.tsx` | Setup wizard 5 step. Richiesto prima di accedere all'app. |
| `/` | `pages/DashboardPage.tsx` | Banner overload, KpiCard, sezione carico risorse, progetti a rischio, alert recenti. |
| `/clienti` | `pages/CustomersPage.tsx` | Tabella clienti con ricerca; CTA "Nuovo" (RoleGuard ADMIN/MANAGER). |
| `/clienti/:id` | `pages/CustomerDetailPage.tsx` | Header cliente (statistiche, contatti), tabella progetti del cliente. |
| `/clienti/:customerId/progetti/:id` | `pages/ProjectDetailPage.tsx` | Breadcrumb, KPI row, Tabs Allocazioni/Alert. |
| `/enterprise` | `pages/EnterprisePage.tsx` | Tabella tutte le risorse con utilizzo, filtri dipartimento/figura; KPI card headcount. |
| `/enterprise/:id` | `pages/EmployeeProfilePage.tsx` | Profilo singola risorsa: figure, KPI ore, tabella progetti in cui è allocata. |
| `/profilo` | `pages/ProfilePage.tsx` | Profilo utente loggato: info, KPI, tabella dei propri progetti (PM o allocazione). |
| `/alerts` | `pages/AlertsPage.tsx` | Lista alert filtrabile per severity/regola. |

## Workload

- `calcEmployeeWorkload()` in `mocks/data.ts` restituisce `EmployeeWorkload[]`
- `EmployeeWorkload.status`: `'ok' | 'warning' | 'critical'` (soglie: critical ≥650h, warning ≥450h)
- Usata nella Dashboard per highlight risorse sovraccariche e nel chatbot

## Tema (light / dark)

- `src/store/themeStore.ts` (Zustand, persist): `{ mode: 'light'|'dark', toggle }`.
- `src/styles/theme.ts`: esporta `lightTheme` e `darkTheme` (`ThemeConfig` di antd).
- `App.tsx`: applica `antTheme.darkAlgorithm` quando `mode === 'dark'`.
- Switch `<Sun> / <Moon>` nell'`AppLayout` header — sempre visibile.

## Stili

- `styles/global.css`: reset minimale + variabili CSS (es. `--tf-color-warning`).
- `styles/theme.ts`: oggetto `ThemeConfig` di Ant Design, applicato in `App.tsx` con `<ConfigProvider theme={theme}>`.
- CSS Modules: nome classe in camelCase `.kpiCard`, import `import styles from './KpiCard.module.css'`.

## Naming

| Cosa | Esempio |
| --- | --- |
| Pagina | `ProjectsPage.tsx` |
| Componente | `ProjectCard.tsx` + `ProjectCard.module.css` |
| Hook | `useProjects.ts` |
| Servizio API | `projectsApi.ts` |
| Store | `authStore.ts` |
| Tipo DTO | `Project`, `ProjectListItem`, `Alert` (in `types/project.ts`, ecc.) |

## Anti-pattern da rifiutare

- `style={{ color: 'red' }}` (CSS inline vietato).
- `fetch` o `axios.create` fuori da `services/api/apiClient.ts`.
- `useEffect` per fare fetch quando esiste un hook TanStack Query.
- Duplicare dati server-side in `useState` o Zustand.
- `any`, `// @ts-ignore`, `as any`.
- Componenti monolitici con 5+ responsabilità.
- Localizzare label in inglese.

## Dopo ogni modifica

1. `npm run build` → 0 errori, 0 warning TS.
2. `npm run lint` → 0 errori.
3. Aggiorna `docs/project-context.md` se hai aggiunto/cambiato pagine o ruoli.
