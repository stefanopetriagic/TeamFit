export type UserRole = 'ADMIN' | 'MANAGER' | 'PROJECT_MANAGER' | 'PRESALES';

export interface User {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: UserRole;
  employeeId: string | null;
  avatarInitials: string;
}
