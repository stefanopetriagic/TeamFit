import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Select, Space, theme } from 'antd';
import { WarningOutlined, AlertOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALERTS, projectById } from '../mocks/data';
import type { Alert, AlertSeverity, AlertRuleCode } from '../types/alert';
import { SeverityTag } from '../components/SeverityTag';
import { KpiCard } from '../components/KpiCard';
import styles from './AlertsPage.module.css';

const { Text } = Typography;

const RULE_LABELS: Record<AlertRuleCode, string> = {
  BUDGET_WARN:   'Budget Warning',
  BUDGET_CRIT:   'Budget Critico',
  FORECAST_OVER: 'Forecast Sforato',
  MARGIN_LOW:    'Margine Basso',
  OVERRUN_ALLOC: 'Ore Superate',
  NO_ACTIVITY:   'Nessuna Attività',
};

export function AlertsPage(): JSX.Element {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | null>(null);
  const [ruleFilter, setRuleFilter] = useState<AlertRuleCode | null>(null);

  const filtered = ALERTS.filter(a => {
    const matchSev = !severityFilter || a.severity === severityFilter;
    const matchRule = !ruleFilter || a.ruleCode === ruleFilter;
    return matchSev && matchRule;
  });

  const criticalCount = ALERTS.filter(a => a.severity === 'Critical').length;
  const warningCount  = ALERTS.filter(a => a.severity === 'Warning').length;
  const ruleTypes     = [...new Set(ALERTS.map(a => a.ruleCode))];

  const columns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      render: (v: string) => <SeverityTag severity={v as AlertSeverity} />,
      width: 100,
    },
    {
      title: 'Progetto',
      render: (_: unknown, rec: Alert) => (
        <Text
          className={styles.projectLink}
          style={{ color: token.colorPrimary }}
          onClick={() => {
              const p = projectById[rec.projectId];
              if (p) navigate(`/clienti/${p.customerId}/progetti/${p.id}`);
            }}
        >
          {rec.projectName}
        </Text>
      ),
    },
    { title: 'Cliente', dataIndex: 'customerName' },
    {
      title: 'Regola',
      dataIndex: 'ruleCode',
      render: (v: AlertRuleCode) => (
        <Tag className={styles.ruleTag}>{RULE_LABELS[v] ?? v}</Tag>
      ),
    },
    { title: 'Messaggio', dataIndex: 'message' },
    {
      title: 'Data',
      dataIndex: 'raisedAt',
      render: (v: string) => new Date(v).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
      width: 120,
    },
  ];

  return (
    <div className={styles.page}>
      <div>
        <div className={styles.pageTitle}>Alert</div>
        <div className={styles.pageSubtitle}>Monitoraggio rischi attivi</div>
      </div>

      <div className={styles.kpiGrid}>
        <KpiCard
          label="Alert Totali"
          value={ALERTS.length}
          icon={<AlertOutlined />}
          accentColor="#F79009"
        />
        <KpiCard
          label="Critici"
          value={criticalCount}
          icon={<WarningOutlined />}
          accentColor={criticalCount > 0 ? '#F04438' : '#12B76A'}
        />
        <KpiCard
          label="Warning"
          value={warningCount}
          icon={<WarningOutlined />}
          accentColor="#F79009"
        />
      </div>

      <Card className={styles.card}>
        <Space className={styles.filterRow}>
          <Select
            placeholder="Severity"
            className={styles.selSeverity}
            allowClear
            value={severityFilter}
            onChange={v => setSeverityFilter((v as AlertSeverity) ?? null)}
            options={[
              { value: 'Critical', label: 'Critical' },
              { value: 'Warning',  label: 'Warning' },
            ]}
          />
          <Select
            placeholder="Tipo di regola"
            className={styles.selRule}
            allowClear
            value={ruleFilter}
            onChange={v => setRuleFilter((v as AlertRuleCode) ?? null)}
            options={ruleTypes.map(r => ({ value: r, label: RULE_LABELS[r] }))}
          />
          <Text type="secondary" className={styles.countText}>{filtered.length} alert</Text>
        </Space>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="middle"
          rowClassName={rec => rec.severity === 'Critical' ? 'ant-table-row-danger' : ''}
        />
      </Card>
    </div>
  );
}
