export type FigureCode = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface Figure {
  code: FigureCode;
  nome: string;
  costoOrario: number;
  tariffaVenditaOraria: number;
}

export interface Employee {
  id: string;
  nome: string;
  cognome: string;
  figureCode: FigureCode;
  dipartimento: string;
  email: string;
  dataAssunzione: string;
}
