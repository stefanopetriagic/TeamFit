import type { JSX } from 'react';
import { Card, Table, Typography, theme, Tag, Progress, Alert, Row, Col } from 'antd';
import {
  EuroOutlined,
  WarningOutlined,
  ProjectOutlined,
  FireOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  PROJECTS, CUSTOMERS, ALERTS, calcKpi, customerById,
  calcEmployeeWorkload, FIGURES,
} from '../mocks/data';
import type { EmployeeWorkload } from '../mocks/data';
import { KpiCard } from '../components/KpiCard';
import { BudgetProgress } from '../components/BudgetProgress';
import { SeverityTag } from '../components/SeverityTag';
import { StatusTag } from '../components/StatusTag';
import styles from './DashboardPage.module.css';

const { Text } = Typography;

const figureByCode = Object.fromEntries(FIGURES.map((f) => [f.code, f]));

const STATUS_BADGE: Record<string, string> = {
  critical: '#F04438',
  warning: '#F79009',
  ok: '#12B76A',
};

const STATUS_LABEL: Record<string, string> = {
  critical: 'Critico',
  warning: 'Attenzione',
  ok: 'OK',
};

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const activeProjects = PROJECTS.filter((p) => p.status === 'Active');
  const allKpis = PROJECTS.map((p) => calcKpi(p));
  const totalWriteUp = allKpis.reduce((s, k) => s + k.writeUp, 0);
  const totalRicavo = allKpis.reduce((s, k) => s + k.ricavoRiconosciuto, 0);
  const avgMargin = totalRicavo > 0 ? (totalWriteUp / totalRicavo) * 100 : 0;
  const criticalCount = ALERTS.filter((a) => a.severity === 'Critical').length;

  // Workload
  const workloads = calcEmployeeWorkload();
  const overloaded = workloads.filter((w) => w.status !== 'ok');
  const criticalWorkload = workloads.filter((w) => w.status === 'critical');

  const topAtRisk = activeProjects
    .map((p) => ({ project: p, kpi: calcKpi(p), customer: customerById[p.customerId] }))
    .filter(({ kpi }) => kpi.budgetConsumatoPct >= 60 || kpi.marginePct < 20)
    .sort((a, b) => b.kpi.budgetConsumatoPct - a.kpi.budgetConsumatoPct)
    .slice(0, 6);

  const recentAlerts = ALERTS.slice(0, 5);

  const riskColumns = [
    {
      title: 'Progetto',
      render: (_: unknown, rec: typeof topAtRisk[0]) => (
        <Text
          className={styles.navLink}
          style={{ color: token.colorPrimary }}
          onClick={() => navigate(`/clienti/${rec.project.customerId}/progetti/${rec.project.id}`)}
        >
          {rec.project.nome}
        </Text>
      ),
    },
    { title: 'Cliente', dataIndex: ['customer', 'ragioneSociale'], width: 180 },
    {
      title: 'Budget %',
      render: (_: unknown, rec: typeof topAtRisk[0]) => (
        <BudgetProgress pct={rec.kpi.budgetConsumatoPct} />
      ),
      width: 150,
    },
    {
      title: 'Margine',
      render: (_: unknown, rec: typeof topAtRisk[0]) => {
        const color =
          rec.kpi.marginePct < 10 ? '#F04438' : rec.kpi.marginePct < 20 ? '#F79009' : '#12B76A';
        return <Text style={{ color, fontWeight: 600 }}>{rec.kpi.marginePct.toFixed(1)}%</Text>;
      },
      width: 90,
    },
    {
      title: 'Stato',
      render: (_: unknown, rec: typeof topAtRisk[0]) => <StatusTag status={rec.project.status} />,
      width: 100,
    },
  ];

  const alertColumns = [
    { title: 'Progetto', dataIndex: 'projectName' },
    {
      title: 'Tipo',
      dataIndex: 'ruleCode',
      render: (v: string) => <Text code className={styles.ruleCode}>{v}</Text>,
      width: 140,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      render: (v: string) => <SeverityTag severity={v as 'Warning' | 'Critical'} />,
      width: 100,
    },
  ];

  const workloadColumns = [
    {
      title: 'Risorsa',
      render: (_: unknown, rec: EmployeeWorkload) => (
        <div className={styles.resourceCell}>
          <div
            className={styles.resourceInitial}
            style={{ background: STATUS_BADGE[rec.status] }}
          >
            {rec.employee.nome[0]}{rec.employee.cognome[0]}
          </div>
          <div>
            <div className={styles.resourceNameRow}>
              <Text
                style={{ color: token.colorPrimary, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => navigate(`/enterprise/${rec.employee.id}`)}
              >
                {rec.employee.nome} {rec.employee.cognome}
              </Text>
              {rec.status === 'critical' && <FireOutlined className={styles.fireIcon} />}
            </div>
            <Text type="secondary" className={styles.resourceRole}>
              {figureByCode[rec.employee.figureCode]?.nome ?? rec.employee.figureCode}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Ore allocate (attive)',
      render: (_: unknown, rec: EmployeeWorkload) => (
        <div className={styles.workloadBar}>
          <Progress
            percent={Math.min(100, Math.round((rec.oreAllocate / 800) * 100))}
            strokeColor={STATUS_BADGE[rec.status]}
            trailColor={token.colorBorderSecondary}
            size="small"
            format={() => (
              <span style={{ fontSize: 12, color: STATUS_BADGE[rec.status], fontWeight: 600 }}>
                {rec.oreAllocate}h
              </span>
            )}
          />
        </div>
      ),
      width: 220,
    },
    {
      title: 'Stato',
      render: (_: unknown, rec: EmployeeWorkload) => (
        <Tag color={rec.status === 'critical' ? 'error' : rec.status === 'warning' ? 'warning' : 'success'}>
          {STATUS_LABEL[rec.status]}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Progetti',
      render: (_: unknown, rec: EmployeeWorkload) => (
        <Text type="secondary" className={styles.projectsList}>
          {rec.progettiAttivi.join(' · ') || '—'}
        </Text>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div>
        <div className={styles.pageTitle}>Dashboard</div>
        <div className={styles.pageSubtitle}>
          {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {criticalWorkload.length > 0 && (
        <Alert
          type="error"
          showIcon
          icon={<FireOutlined />}
          message={
            <Text strong>
              {criticalWorkload.length === 1 ? '1 risorsa in sovraccarico critico' : `${criticalWorkload.length} risorse in sovraccarico critico`}
              :&nbsp;
              {criticalWorkload.map((w) => `${w.employee.nome} ${w.employee.cognome} (${w.oreAllocate}h)`).join(', ')}
            </Text>
          }
          description="Valuta una riallocazione. Usa l'AI Agent nel pannello laterale per proposte automatiche."
          className={styles.overloadBanner}
        />
      )}

      <div className={styles.kpiGrid}>
        <KpiCard
          label="Progetti Attivi"
          value={activeProjects.length}
          icon={<ProjectOutlined />}
          accentColor="#1A56E8"
          trend={`${PROJECTS.length} totali nel portfolio`}
        />
        <KpiCard
          label="Write-up Totale"
          value={`€ ${(totalWriteUp / 1000).toFixed(0)}K`}
          icon={<EuroOutlined />}
          accentColor="#12B76A"
          trend={`Margine medio ${avgMargin.toFixed(1)}%`}
        />
        <KpiCard
          label="Clienti"
          value={CUSTOMERS.length}
          icon={<UserOutlined />}
          accentColor="#0BA5EC"
          trend="clienti nel portfolio"
        />
        <KpiCard
          label="Alert Critici"
          value={criticalCount}
          icon={<WarningOutlined />}
          accentColor={criticalCount > 0 ? '#F04438' : '#12B76A'}
          trend={`${ALERTS.length} alert totali aperti`}
        />
      </div>

      <Card
        className={styles.card}
        title={
          <div className={styles.cardTitleRow}>
            <span>Carico risorse</span>
            <Tag color="error">{criticalWorkload.length} critici</Tag>
            <Tag color="warning">{overloaded.filter((w) => w.status === 'warning').length} in attenzione</Tag>
          </div>
        }
        extra={
          <Text
            className={styles.navLink}
            style={{ color: token.colorPrimary }}
            onClick={() => navigate('/enterprise')}
          >
            Vedi tutto →
          </Text>
        }
      >
        <Table
          dataSource={overloaded.length > 0 ? overloaded : workloads.slice(0, 5)}
          columns={workloadColumns}
          rowKey={(r) => r.employee.id}
          pagination={false}
          size="small"
          rowClassName={(rec: EmployeeWorkload) =>
            rec.status === 'critical' ? styles.rowCritical : rec.status === 'warning' ? styles.rowWarning : ''
          }
        />
      </Card>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            className={styles.card}
            title="Progetti a rischio"
            extra={
              <Text
                className={styles.navLink}
                style={{ color: token.colorPrimary }}
                onClick={() => navigate('/clienti')}
              >
                Tutti →
              </Text>
            }
          >
            <Table
              dataSource={topAtRisk}
              columns={riskColumns}
              rowKey={(r) => r.project.id}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col span={10}>
          <Card
            className={styles.card}
            title="Alert recenti"
            extra={
              <Text
                className={styles.navLink}
                style={{ color: token.colorPrimary }}
                onClick={() => navigate('/alerts')}
              >
                Tutti →
              </Text>
            }
          >
            <Table
              dataSource={recentAlerts}
              columns={alertColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

