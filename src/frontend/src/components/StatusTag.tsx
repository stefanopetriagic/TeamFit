import type { JSX } from 'react';
import { Tag } from 'antd';
import type { ProjectStatus } from '../types/project';

interface StatusTagProps {
  status: ProjectStatus;
}

const config: Record<ProjectStatus, { color: string; label: string }> = {
  Active:    { color: 'processing', label: 'Attivo' },
  Completed: { color: 'success',    label: 'Completato' },
  Suspended: { color: 'warning',    label: 'Sospeso' },
  Closed:    { color: 'default',    label: 'Chiuso' },
};

export function StatusTag({ status }: StatusTagProps): JSX.Element {
  const { color, label } = config[status];
  return <Tag color={color}>{label}</Tag>;
}
