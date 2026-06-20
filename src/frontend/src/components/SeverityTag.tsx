import type { JSX } from 'react';
import { Tag } from 'antd';
import type { AlertSeverity } from '../types/alert';

interface SeverityTagProps {
  severity: AlertSeverity;
}

const config: Record<AlertSeverity, { color: string; label: string }> = {
  Warning:  { color: 'warning', label: 'Warning' },
  Critical: { color: 'error',   label: 'Critical' },
};

export function SeverityTag({ severity }: SeverityTagProps): JSX.Element {
  const { color, label } = config[severity];
  return <Tag color={color}>{label}</Tag>;
}
