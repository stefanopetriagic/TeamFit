export type AlertSeverity = 'Warning' | 'Critical';
export type AlertRuleCode =
  | 'BUDGET_WARN'
  | 'BUDGET_CRIT'
  | 'FORECAST_OVER'
  | 'MARGIN_LOW'
  | 'OVERRUN_ALLOC'
  | 'NO_ACTIVITY';

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  customerName: string;
  ruleCode: AlertRuleCode;
  severity: AlertSeverity;
  message: string;
  raisedAt: string;
}
