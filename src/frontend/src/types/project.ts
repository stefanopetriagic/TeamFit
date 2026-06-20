export type ProjectStatus = 'Active' | 'Completed' | 'Suspended' | 'Closed';

export interface Allocation {
  id: string;
  projectId: string;
  employeeId: string;
  figureCode: string;
  oreAllocate: number;
  oreConsuntivate: number;
}

export interface Project {
  id: string;
  code: string;
  nome: string;
  customerId: string;
  pmId: string;
  presalesId: string | null;
  status: ProjectStatus;
  dataInizio: string;
  dataFine: string;
  budgetEuro: number;
  budgetOre: number;
  note: string;
  allocations: Allocation[];
}

export interface ProjectKpi {
  ricavoRiconosciuto: number;
  costoSostenuto: number;
  writeUp: number;
  budgetConsumatoPct: number;
  forecastAFinire: number;
  marginePct: number;
  oreTotaliAllocate: number;
  oreTotaliConsuntivate: number;
}
