import type { JSX, ReactNode } from 'react';
import { Card, theme } from 'antd';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  trend?: ReactNode;
  icon?: ReactNode;
  accentColor?: string;
}

export function KpiCard({ label, value, trend, icon, accentColor }: KpiCardProps): JSX.Element {
  const { token } = theme.useToken();

  return (
    <Card
      className={styles.card}
      style={{
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
      }}
      styles={{ body: { padding: '18px 20px' } }}
    >
      <div className={styles.row}>
        <div>
          <div className={styles.label}>{label}</div>
          <div className={styles.value}>{value}</div>
          {trend && <div className={styles.delta}>{trend}</div>}
        </div>
        {icon && (
          <div
            className={styles.iconBox}
            style={{
              background: accentColor ? `${accentColor}18` : token.colorPrimaryBg,
              color: accentColor ?? token.colorPrimary,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
