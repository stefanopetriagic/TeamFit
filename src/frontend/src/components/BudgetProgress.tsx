import type { JSX } from 'react';
import { Progress, Tooltip } from 'antd';
import styles from './BudgetProgress.module.css';

interface BudgetProgressProps {
  pct: number;
}

function resolveStatus(pct: number): 'normal' | 'exception' | 'success' {
  if (pct >= 90) return 'exception';
  if (pct >= 100) return 'exception';
  return 'normal';
}

function resolveColor(pct: number): string {
  if (pct >= 90) return '#F04438';
  if (pct >= 70) return '#F79009';
  return '#12B76A';
}

export function BudgetProgress({ pct }: BudgetProgressProps): JSX.Element {
  const capped = Math.min(pct, 100);
  return (
    <Tooltip title={`${pct.toFixed(1)}% consumato`}>
      <Progress
        percent={Math.round(capped)}
        size="small"
        status={resolveStatus(pct)}
        strokeColor={resolveColor(pct)}
        showInfo={true}
        className={styles.progress}
      />
    </Tooltip>
  );
}
