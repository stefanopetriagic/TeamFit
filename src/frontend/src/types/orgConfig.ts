export type OrgType =
  | 'IT_CONSULTING'
  | 'DIGITAL_AGENCY'
  | 'SYSTEM_INTEGRATOR'
  | 'MANAGED_SERVICES'
  | 'ALTRO';

export interface OrgFigure {
  code: string;
  titolo: string;
  costoOrario: number;
  tariffaVenditaOraria: number;
}

export interface OrgResource {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  figureCode: string;
  devopsUsername?: string;
}

export interface DevOpsSyncConfig {
  url: string;
  organization: string;
  enabled: boolean;
}

export interface OrgConfig {
  nome: string;
  missione: string;
  tipo: OrgType;
  figure: OrgFigure[];
  risorse: OrgResource[];
  devops?: DevOpsSyncConfig;
}
