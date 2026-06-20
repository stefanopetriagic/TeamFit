import type { User } from '../types/user';
import type { Customer } from '../types/customer';
import type { Figure, Employee } from '../types/employee';
import type { Project, Allocation } from '../types/project';
import type { Alert } from '../types/alert';

// ─── Figures ────────────────────────────────────────────────────────────────
export const FIGURES: Figure[] = [
  { code: 'A', nome: 'Junior Analyst',       costoOrario: 25,  tariffaVenditaOraria: 60  },
  { code: 'B', nome: 'Analyst',              costoOrario: 35,  tariffaVenditaOraria: 80  },
  { code: 'C', nome: 'Senior Analyst',       costoOrario: 50,  tariffaVenditaOraria: 110 },
  { code: 'D', nome: 'Consultant',           costoOrario: 65,  tariffaVenditaOraria: 140 },
  { code: 'E', nome: 'Senior Consultant',    costoOrario: 85,  tariffaVenditaOraria: 180 },
  { code: 'F', nome: 'Principal Consultant', costoOrario: 110, tariffaVenditaOraria: 230 },
];

export const figureByCode = Object.fromEntries(FIGURES.map(f => [f.code, f])) as Record<string, Figure>;

// ─── Users ───────────────────────────────────────────────────────────────────
export const USERS: User[] = [
  { id: 'u1', nome: 'Giulia',   cognome: 'Ferretti',  email: 'g.ferretti@manag.it',  role: 'ADMIN',           employeeId: 'e1',  avatarInitials: 'GF' },
  { id: 'u2', nome: 'Marco',    cognome: 'Bianchi',   email: 'm.bianchi@manag.it',   role: 'MANAGER',         employeeId: 'e2',  avatarInitials: 'MB' },
  { id: 'u3', nome: 'Luca',     cognome: 'Romano',    email: 'l.romano@manag.it',    role: 'PROJECT_MANAGER', employeeId: 'e3',  avatarInitials: 'LR' },
  { id: 'u4', nome: 'Sofia',    cognome: 'Mancini',   email: 's.mancini@manag.it',   role: 'PROJECT_MANAGER', employeeId: 'e4',  avatarInitials: 'SM' },
  { id: 'u5', nome: 'Andrea',   cognome: 'Caruso',    email: 'a.caruso@manag.it',    role: 'PRESALES',        employeeId: 'e5',  avatarInitials: 'AC' },
];

// ─── Employees ───────────────────────────────────────────────────────────────
export const EMPLOYEES: Employee[] = [
  { id: 'e1',  nome: 'Giulia',    cognome: 'Ferretti',   figureCode: 'F', dipartimento: 'Management',    email: 'g.ferretti@manag.it',  dataAssunzione: '2018-03-01' },
  { id: 'e2',  nome: 'Marco',     cognome: 'Bianchi',    figureCode: 'F', dipartimento: 'Management',    email: 'm.bianchi@manag.it',   dataAssunzione: '2017-07-15' },
  { id: 'e3',  nome: 'Luca',      cognome: 'Romano',     figureCode: 'E', dipartimento: 'Delivery',      email: 'l.romano@manag.it',    dataAssunzione: '2020-01-10' },
  { id: 'e4',  nome: 'Sofia',     cognome: 'Mancini',    figureCode: 'E', dipartimento: 'Delivery',      email: 's.mancini@manag.it',   dataAssunzione: '2019-09-03' },
  { id: 'e5',  nome: 'Andrea',    cognome: 'Caruso',     figureCode: 'D', dipartimento: 'Presales',      email: 'a.caruso@manag.it',    dataAssunzione: '2021-04-20' },
  { id: 'e6',  nome: 'Chiara',    cognome: 'Esposito',   figureCode: 'D', dipartimento: 'Delivery',      email: 'c.esposito@manag.it',  dataAssunzione: '2021-11-08' },
  { id: 'e7',  nome: 'Davide',    cognome: 'Ricci',      figureCode: 'C', dipartimento: 'Delivery',      email: 'd.ricci@manag.it',     dataAssunzione: '2022-02-14' },
  { id: 'e8',  nome: 'Elena',     cognome: 'Conti',      figureCode: 'C', dipartimento: 'Delivery',      email: 'e.conti@manag.it',     dataAssunzione: '2022-06-01' },
  { id: 'e9',  nome: 'Francesco', cognome: 'Greco',      figureCode: 'B', dipartimento: 'Delivery',      email: 'f.greco@manag.it',     dataAssunzione: '2023-01-16' },
  { id: 'e10', nome: 'Giulia',    cognome: 'Lombardi',   figureCode: 'B', dipartimento: 'Delivery',      email: 'g.lombardi@manag.it',  dataAssunzione: '2023-03-20' },
  { id: 'e11', nome: 'Matteo',    cognome: 'Pellegrini', figureCode: 'A', dipartimento: 'Delivery',      email: 'm.pellegrini@manag.it',dataAssunzione: '2024-01-08' },
  { id: 'e12', nome: 'Sara',      cognome: 'Fontana',    figureCode: 'A', dipartimento: 'Delivery',      email: 's.fontana@manag.it',   dataAssunzione: '2024-02-19' },
  { id: 'e13', nome: 'Nicola',    cognome: 'Barbieri',   figureCode: 'D', dipartimento: 'Delivery',      email: 'n.barbieri@manag.it',  dataAssunzione: '2020-08-01' },
  { id: 'e14', nome: 'Valentina', cognome: 'Gallo',      figureCode: 'C', dipartimento: 'Delivery',      email: 'v.gallo@manag.it',     dataAssunzione: '2021-05-10' },
  { id: 'e15', nome: 'Paolo',     cognome: 'Marini',     figureCode: 'B', dipartimento: 'Delivery',      email: 'p.marini@manag.it',    dataAssunzione: '2023-09-01' },
];

export const employeeById = Object.fromEntries(EMPLOYEES.map(e => [e.id, e])) as Record<string, Employee>;

// ─── Customers ───────────────────────────────────────────────────────────────
export const CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    ragioneSociale: 'Nexus Digital S.p.A.',
    codice: 'NDG-001',
    settore: 'Tecnologia',
    referente: 'Roberto Vitali',
    email: 'r.vitali@nexusdigital.it',
    telefono: '+39 02 1234567',
    citta: 'Milano',
    projectCount: 4,
    activeProjectCount: 3,
  },
  {
    id: 'c2',
    ragioneSociale: 'Aurelia Finance Group',
    codice: 'AFG-002',
    settore: 'Finanza',
    referente: 'Laura Benedetti',
    email: 'l.benedetti@aureliafg.it',
    telefono: '+39 06 9876543',
    citta: 'Roma',
    projectCount: 3,
    activeProjectCount: 2,
  },
  {
    id: 'c3',
    ragioneSociale: 'Mediterraneo Retail S.r.l.',
    codice: 'MRR-003',
    settore: 'Retail',
    referente: 'Giovanni Esposito',
    email: 'g.esposito@medretail.it',
    telefono: '+39 081 5551234',
    citta: 'Napoli',
    projectCount: 2,
    activeProjectCount: 2,
  },
];

export const customerById = Object.fromEntries(CUSTOMERS.map(c => [c.id, c])) as Record<string, Customer>;

// ─── Allocations ─────────────────────────────────────────────────────────────
export const ALLOCATIONS: Allocation[] = [
  // p1 — Nexus Digital: Digital Transformation (on track)
  { id: 'a1',  projectId: 'p1', employeeId: 'e3',  figureCode: 'E', oreAllocate: 200, oreConsuntivate: 120 },
  { id: 'a2',  projectId: 'p1', employeeId: 'e7',  figureCode: 'C', oreAllocate: 300, oreConsuntivate: 170 },
  { id: 'a3',  projectId: 'p1', employeeId: 'e9',  figureCode: 'B', oreAllocate: 400, oreConsuntivate: 200 },
  { id: 'a4',  projectId: 'p1', employeeId: 'e11', figureCode: 'A', oreAllocate: 250, oreConsuntivate: 100 },
  // p2 — Nexus Digital: Cloud Migration (budget at 88% — BUDGET_CRIT)
  { id: 'a5',  projectId: 'p2', employeeId: 'e4',  figureCode: 'E', oreAllocate: 180, oreConsuntivate: 175 },
  { id: 'a6',  projectId: 'p2', employeeId: 'e6',  figureCode: 'D', oreAllocate: 250, oreConsuntivate: 248 },
  { id: 'a7',  projectId: 'p2', employeeId: 'e8',  figureCode: 'C', oreAllocate: 200, oreConsuntivate: 170 },
  { id: 'a8',  projectId: 'p2', employeeId: 'e10', figureCode: 'B', oreAllocate: 300, oreConsuntivate: 210 },  // overrun on a6
  // p3 — Nexus Digital: Security Audit (low margin — MARGIN_LOW)
  { id: 'a9',  projectId: 'p3', employeeId: 'e3',  figureCode: 'E', oreAllocate: 80,  oreConsuntivate: 76  },
  { id: 'a10', projectId: 'p3', employeeId: 'e13', figureCode: 'D', oreAllocate: 120, oreConsuntivate: 118 },
  // p4 — Nexus Digital: BI Dashboard (completed)
  { id: 'a11', projectId: 'p4', employeeId: 'e4',  figureCode: 'E', oreAllocate: 100, oreConsuntivate: 98  },
  { id: 'a12', projectId: 'p4', employeeId: 'e14', figureCode: 'C', oreAllocate: 150, oreConsuntivate: 145 },
  // p5 — Aurelia Finance: Risk Model (on track)
  { id: 'a13', projectId: 'p5', employeeId: 'e3',  figureCode: 'E', oreAllocate: 160, oreConsuntivate: 80  },
  { id: 'a14', projectId: 'p5', employeeId: 'e6',  figureCode: 'D', oreAllocate: 200, oreConsuntivate: 90  },
  { id: 'a15', projectId: 'p5', employeeId: 'e7',  figureCode: 'C', oreAllocate: 280, oreConsuntivate: 100 },
  { id: 'a16', projectId: 'p5', employeeId: 'e12', figureCode: 'A', oreAllocate: 200, oreConsuntivate: 60  },
  // p6 — Aurelia Finance: Compliance Framework (no activity — NO_ACTIVITY)
  { id: 'a17', projectId: 'p6', employeeId: 'e4',  figureCode: 'E', oreAllocate: 120, oreConsuntivate: 40  },
  { id: 'a18', projectId: 'p6', employeeId: 'e13', figureCode: 'D', oreAllocate: 160, oreConsuntivate: 38  },
  // p7 — Aurelia Finance: Core Banking (suspended)
  { id: 'a19', projectId: 'p7', employeeId: 'e3',  figureCode: 'E', oreAllocate: 300, oreConsuntivate: 120 },
  { id: 'a20', projectId: 'p7', employeeId: 'e6',  figureCode: 'D', oreAllocate: 350, oreConsuntivate: 140 },
  // p8 — Mediterraneo Retail: E-commerce Platform (forecast over — FORECAST_OVER)
  { id: 'a21', projectId: 'p8', employeeId: 'e4',  figureCode: 'E', oreAllocate: 200, oreConsuntivate: 185 },
  { id: 'a22', projectId: 'p8', employeeId: 'e8',  figureCode: 'C', oreAllocate: 300, oreConsuntivate: 292 },
  { id: 'a23', projectId: 'p8', employeeId: 'e9',  figureCode: 'B', oreAllocate: 400, oreConsuntivate: 310 },
  { id: 'a24', projectId: 'p8', employeeId: 'e15', figureCode: 'B', oreAllocate: 200, oreConsuntivate: 195 },
  // p9 — Mediterraneo Retail: Loyalty Program (on track)
  { id: 'a25', projectId: 'p9', employeeId: 'e7',  figureCode: 'C', oreAllocate: 150, oreConsuntivate: 60  },
  { id: 'a26', projectId: 'p9', employeeId: 'e10', figureCode: 'B', oreAllocate: 200, oreConsuntivate: 70  },
  { id: 'a27', projectId: 'p9', employeeId: 'e11', figureCode: 'A', oreAllocate: 250, oreConsuntivate: 80  },
];

const allocsByProject = ALLOCATIONS.reduce<Record<string, Allocation[]>>((acc, a) => {
  if (!acc[a.projectId]) acc[a.projectId] = [];
  acc[a.projectId].push(a);
  return acc;
}, {});

// ─── Projects ────────────────────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  {
    id: 'p1', code: 'NDG-2024-001', nome: 'Digital Transformation Hub',
    customerId: 'c1', pmId: 'u3', presalesId: 'u5',
    status: 'Active',
    dataInizio: '2024-03-01', dataFine: '2025-02-28',
    budgetEuro: 280000, budgetOre: 1200,
    note: 'Progetto strategico di trasformazione digitale per processi interni.',
    allocations: allocsByProject['p1'] ?? [],
  },
  {
    id: 'p2', code: 'NDG-2024-002', nome: 'Cloud Migration AWS',
    customerId: 'c1', pmId: 'u4', presalesId: 'u5',
    status: 'Active',
    dataInizio: '2024-06-01', dataFine: '2025-01-31',
    budgetEuro: 150000, budgetOre: 900,
    note: 'Migrazione infrastruttura on-premise verso AWS.',
    allocations: allocsByProject['p2'] ?? [],
  },
  {
    id: 'p3', code: 'NDG-2024-003', nome: 'Security Audit & Remediation',
    customerId: 'c1', pmId: 'u3', presalesId: null,
    status: 'Active',
    dataInizio: '2024-09-15', dataFine: '2025-03-15',
    budgetEuro: 55000, budgetOre: 280,
    note: 'Audit di sicurezza e piano di remediation.',
    allocations: allocsByProject['p3'] ?? [],
  },
  {
    id: 'p4', code: 'NDG-2023-001', nome: 'Business Intelligence Dashboard',
    customerId: 'c1', pmId: 'u4', presalesId: null,
    status: 'Completed',
    dataInizio: '2023-04-01', dataFine: '2024-01-31',
    budgetEuro: 95000, budgetOre: 550,
    note: 'Dashboard BI per i C-level. Completato con successo.',
    allocations: allocsByProject['p4'] ?? [],
  },
  {
    id: 'p5', code: 'AFG-2024-001', nome: 'Risk Model Next-Gen',
    customerId: 'c2', pmId: 'u3', presalesId: 'u5',
    status: 'Active',
    dataInizio: '2024-05-01', dataFine: '2025-06-30',
    budgetEuro: 320000, budgetOre: 1400,
    note: 'Sviluppo modello di rischio di nuova generazione.',
    allocations: allocsByProject['p5'] ?? [],
  },
  {
    id: 'p6', code: 'AFG-2024-002', nome: 'Compliance Framework 2025',
    customerId: 'c2', pmId: 'u4', presalesId: null,
    status: 'Active',
    dataInizio: '2024-07-01', dataFine: '2025-04-30',
    budgetEuro: 110000, budgetOre: 600,
    note: 'Adeguamento normativo DORA e NIS2.',
    allocations: allocsByProject['p6'] ?? [],
  },
  {
    id: 'p7', code: 'AFG-2023-001', nome: 'Core Banking Upgrade',
    customerId: 'c2', pmId: 'u3', presalesId: null,
    status: 'Suspended',
    dataInizio: '2023-11-01', dataFine: '2025-05-31',
    budgetEuro: 480000, budgetOre: 2000,
    note: 'Upgrade sistema core banking. Sospeso per priorità cliente.',
    allocations: allocsByProject['p7'] ?? [],
  },
  {
    id: 'p8', code: 'MRR-2024-001', nome: 'E-commerce Platform v3',
    customerId: 'c3', pmId: 'u4', presalesId: 'u5',
    status: 'Active',
    dataInizio: '2024-04-01', dataFine: '2025-02-28',
    budgetEuro: 175000, budgetOre: 1100,
    note: 'Riscrittura completa piattaforma e-commerce.',
    allocations: allocsByProject['p8'] ?? [],
  },
  {
    id: 'p9', code: 'MRR-2024-002', nome: 'Loyalty Program Integration',
    customerId: 'c3', pmId: 'u3', presalesId: null,
    status: 'Active',
    dataInizio: '2024-10-01', dataFine: '2025-07-31',
    budgetEuro: 80000, budgetOre: 600,
    note: 'Integrazione programma fedeltà con CRM e POS.',
    allocations: allocsByProject['p9'] ?? [],
  },
];

export const projectById = Object.fromEntries(PROJECTS.map(p => [p.id, p])) as Record<string, Project>;

// ─── KPI Calculator ──────────────────────────────────────────────────────────
import type { ProjectKpi } from '../types/project';

export function calcKpi(project: Project): ProjectKpi {
  const allocs = project.allocations;
  let ricavo = 0;
  let costo = 0;
  let oreAlloc = 0;
  let oreConsu = 0;

  for (const a of allocs) {
    const fig = figureByCode[a.figureCode];
    if (!fig) continue;
    ricavo += a.oreConsuntivate * fig.tariffaVenditaOraria;
    costo  += a.oreConsuntivate * fig.costoOrario;
    oreAlloc += a.oreAllocate;
    oreConsu += a.oreConsuntivate;
  }

  const writeUp = ricavo - costo;
  const budgetConsumatoPct = project.budgetEuro > 0 ? (costo / project.budgetEuro) * 100 : 0;
  const forecastAFinire = oreConsu > 0 ? (costo / oreConsu) * oreAlloc : 0;
  const marginePct = ricavo > 0 ? (writeUp / ricavo) * 100 : 0;

  return {
    ricavoRiconosciuto: Math.round(ricavo),
    costoSostenuto: Math.round(costo),
    writeUp: Math.round(writeUp),
    budgetConsumatoPct: Math.round(budgetConsumatoPct * 10) / 10,
    forecastAFinire: Math.round(forecastAFinire),
    marginePct: Math.round(marginePct * 10) / 10,
    oreTotaliAllocate: oreAlloc,
    oreTotaliConsuntivate: oreConsu,
  };
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  let idx = 1;

  for (const project of PROJECTS) {
    if (project.status !== 'Active') continue;
    const kpi = calcKpi(project);
    const customer = customerById[project.customerId];
    const base = { projectId: project.id, projectName: project.nome, customerName: customer?.ragioneSociale ?? '' };

    if (kpi.budgetConsumatoPct >= 90) {
      alerts.push({ id: `al${idx++}`, ...base, ruleCode: 'BUDGET_CRIT', severity: 'Critical',
        message: `Budget consumato al ${kpi.budgetConsumatoPct.toFixed(1)}% — soglia critica superata.`, raisedAt: '2026-06-18T09:00:00' });
    } else if (kpi.budgetConsumatoPct >= 70) {
      alerts.push({ id: `al${idx++}`, ...base, ruleCode: 'BUDGET_WARN', severity: 'Warning',
        message: `Budget consumato al ${kpi.budgetConsumatoPct.toFixed(1)}% — attenzione.`, raisedAt: '2026-06-17T14:30:00' });
    }
    if (kpi.forecastAFinire > project.budgetEuro) {
      alerts.push({ id: `al${idx++}`, ...base, ruleCode: 'FORECAST_OVER', severity: 'Critical',
        message: `Forecast a finire €${kpi.forecastAFinire.toLocaleString('it-IT')} supera il budget €${project.budgetEuro.toLocaleString('it-IT')}.`, raisedAt: '2026-06-19T08:15:00' });
    }
    if (kpi.ricavoRiconosciuto > 0 && kpi.marginePct < 15) {
      alerts.push({ id: `al${idx++}`, ...base, ruleCode: 'MARGIN_LOW', severity: 'Warning',
        message: `Margine al ${kpi.marginePct.toFixed(1)}% — sotto la soglia del 15%.`, raisedAt: '2026-06-16T11:00:00' });
    }
    const hasOverrun = project.allocations.some(a => a.oreConsuntivate > a.oreAllocate);
    if (hasOverrun) {
      alerts.push({ id: `al${idx++}`, ...base, ruleCode: 'OVERRUN_ALLOC', severity: 'Warning',
        message: 'Una o più allocazioni superano le ore pianificate.', raisedAt: '2026-06-15T16:45:00' });
    }
    // p6 has no activity (simulated stale data)
    if (project.id === 'p6') {
      alerts.push({ id: `al${idx++}`, ...base, ruleCode: 'NO_ACTIVITY', severity: 'Warning',
        message: 'Nessuna modifica ai consuntivi negli ultimi 14 giorni.', raisedAt: '2026-06-05T08:00:00' });
    }
  }
  return alerts;
}

export const ALERTS: Alert[] = generateAlerts();

// ─── Workload Calculator ──────────────────────────────────────────────────────

export type WorkloadStatus = 'ok' | 'warning' | 'critical';

export interface EmployeeWorkload {
  employee: Employee;
  oreAllocate: number;
  progettiAttivi: string[];
  status: WorkloadStatus;
}

export function calcEmployeeWorkload(): EmployeeWorkload[] {
  const activeProjects = PROJECTS.filter((p) => p.status === 'Active');
  const workloadMap = new Map<string, { ore: number; projects: string[] }>();

  for (const project of activeProjects) {
    for (const alloc of project.allocations) {
      const existing = workloadMap.get(alloc.employeeId) ?? { ore: 0, projects: [] };
      workloadMap.set(alloc.employeeId, {
        ore: existing.ore + alloc.oreAllocate,
        projects: existing.projects.includes(project.nome)
          ? existing.projects
          : [...existing.projects, project.nome],
      });
    }
  }

  return EMPLOYEES.map((emp) => {
    const data = workloadMap.get(emp.id) ?? { ore: 0, projects: [] };
    const status: WorkloadStatus =
      data.ore >= 650 ? 'critical' : data.ore >= 450 ? 'warning' : 'ok';
    return {
      employee: emp,
      oreAllocate: data.ore,
      progettiAttivi: data.projects,
      status,
    };
  }).sort((a, b) => b.oreAllocate - a.oreAllocate);
}
