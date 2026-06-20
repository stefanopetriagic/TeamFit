import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Tabs, Progress, theme } from 'antd';
import {
  RightOutlined, EuroOutlined, ClockCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PROJECTS, customerById, figureByCode, calcKpi, ALERTS, USERS,
  employeeById,
} from '../mocks/data';
import type { Allocation } from '../types/project';
import { SeverityTag } from '../components/SeverityTag';
import { BudgetProgress } from '../components/BudgetProgress';
import { KpiCard } from '../components/KpiCard';
import { StatusTag } from '../components/StatusTag';
import styles from './ProjectDetailPage.module.css';

const { Text } = Typography;

export function ProjectDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ customerId: string; id: string }>();
  const { token } = theme.useToken();

  const project = PROJECTS.find(p => p.id === id);
  if (!project) return <div>Progetto non trovato.</div>;

  const customer = customerById[project.customerId];
  const kpi = calcKpi(project);
  const pm = USERS.find(u => u.id === project.pmId);
  const presales = project.presalesId ? USERS.find(u => u.id === project.presalesId) : null;
  const projectAlerts = ALERTS.filter(a => a.projectId === project.id);

  const budgetBannerColor = kpi.budgetConsumatoPct >= 90 ? '#F04438'
    : kpi.budgetConsumatoPct >= 70 ? '#F79009'
    : '#1A56E8';

  const allocColumns = [
    {
      title: 'Risorsa',
      render: (_: unknown, rec: Allocation) => {
        const emp = employeeById[rec.employeeId];
        return (
          <div className={styles.allocationRow}>
            <span
              className={styles.employeeName}
              style={{ color: token.colorPrimary }}
              onClick={() => navigate(`/enterprise/${rec.employeeId}`)}
            >
              {emp ? `${emp.nome} ${emp.cognome}` : rec.employeeId}
            </span>
            <span className={styles.figureBadge}>
              Figura {rec.figureCode} — {figureByCode[rec.figureCode]?.nome ?? ''}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Ore Allocate',
      dataIndex: 'oreAllocate',
      align: 'right' as const,
      render: (v: number) => <Text>{v}h</Text>,
    },
    {
      title: 'Ore Consuntivate',
      dataIndex: 'oreConsuntivate',
      align: 'right' as const,
      render: (v: number, rec: Allocation) => {
        const isOver = v > rec.oreAllocate;
        return <Text style={{ color: isOver ? '#F04438' : undefined, fontWeight: isOver ? 600 : 400 }}>{v}h {isOver && '⚠'}</Text>;
      },
    },
    {
      title: 'Avanzamento',
      render: (_: unknown, rec: Allocation) => {
        const pct = rec.oreAllocate > 0 ? (rec.oreConsuntivate / rec.oreAllocate) * 100 : 0;
        const color = pct > 100 ? '#F04438' : pct > 80 ? '#F79009' : '#12B76A';
        return <Progress percent={Math.min(Math.round(pct), 100)} size="small" strokeColor={color} showInfo />;
      },
      width: 160,
    },
    {
      title: 'Tariffa vendita',
      render: (_: unknown, rec: Allocation) => {
        const fig = figureByCode[rec.figureCode];
        return fig ? <Text>€{fig.tariffaVenditaOraria}/h</Text> : null;
      },
      align: 'right' as const,
    },
    {
      title: 'Ricavo',
      render: (_: unknown, rec: Allocation) => {
        const fig = figureByCode[rec.figureCode];
        const ricavo = fig ? rec.oreConsuntivate * fig.tariffaVenditaOraria : 0;
        return <Text strong>€{ricavo.toLocaleString('it-IT')}</Text>;
      },
      align: 'right' as const,
    },
  ];

  const alertColumns = [
    { title: 'Regola', dataIndex: 'ruleCode', render: (v: string) => <Text code className={styles.ruleCode}>{v}</Text> },
    { title: 'Severity', dataIndex: 'severity', render: (v: string) => <SeverityTag severity={v as 'Warning' | 'Critical'} /> },
    { title: 'Messaggio', dataIndex: 'message' },
    { title: 'Data', dataIndex: 'raisedAt', render: (v: string) => new Date(v).toLocaleDateString('it-IT') },
  ];

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => navigate('/clienti')}>Clienti</span>
        <RightOutlined className={styles.breadcrumbIcon} />
        <span onClick={() => navigate(`/clienti/${customer?.id}`)}>{customer?.ragioneSociale}</span>
        <RightOutlined className={styles.breadcrumbIcon} />
        <Text strong>{project.nome}</Text>
      </div>

      {/* Header */}
      <Card
        className={styles.headerCard}
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.headerBanner} style={{ background: budgetBannerColor }} />
        <div className={styles.bodyPad}>
          <div className={styles.headerContent}>
            <div>
              <div className={styles.spaceHeader}>
                <StatusTag status={project.status} />
                {projectAlerts.length > 0 && (
                  <Tag color="error" icon={<WarningOutlined />}>{projectAlerts.length} alert</Tag>
                )}
              </div>
              <div className={styles.projectTitle}>{project.nome}</div>
              <span className={styles.projectCode}>{project.code}</span>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Cliente</span>
                  <Text
                    className={styles.clientLink}
                    style={{ color: token.colorPrimary }}
                    onClick={() => navigate(`/clienti/${customer?.id}`)}
                  >
                    {customer?.ragioneSociale}
                  </Text>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Project Manager</span>
                  <span className={styles.metaValue}>{pm ? `${pm.nome} ${pm.cognome}` : '–'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Presales</span>
                  <span className={styles.metaValue}>{presales ? `${presales.nome} ${presales.cognome}` : '–'}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Periodo</span>
                  <span className={styles.metaValue}>
                    {new Date(project.dataInizio).toLocaleDateString('it-IT')} → {new Date(project.dataFine).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>

              {project.note && (
                <Text type="secondary" className={styles.noteText}>
                  {project.note}
                </Text>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* KPI row */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Budget €"
          value={`€ ${project.budgetEuro.toLocaleString('it-IT')}`}
          icon={<EuroOutlined />}
          accentColor="#1A56E8"
          trend={<BudgetProgress pct={kpi.budgetConsumatoPct} />}
        />
        <KpiCard
          label="Write-up"
          value={`€ ${kpi.writeUp.toLocaleString('it-IT')}`}
          icon={<EuroOutlined />}
          accentColor={kpi.writeUp >= 0 ? '#12B76A' : '#F04438'}
          trend={`Margine ${kpi.marginePct.toFixed(1)}%`}
        />
        <KpiCard
          label="Ore Consuntivate"
          value={`${kpi.oreTotaliConsuntivate}h`}
          icon={<ClockCircleOutlined />}
          accentColor="#0BA5EC"
          trend={`su ${kpi.oreTotaliAllocate}h allocate`}
        />
        <KpiCard
          label="Forecast a finire"
          value={`€ ${kpi.forecastAFinire.toLocaleString('it-IT')}`}
          icon={<EuroOutlined />}
          accentColor={kpi.forecastAFinire > project.budgetEuro ? '#F04438' : '#12B76A'}
          trend={kpi.forecastAFinire > project.budgetEuro ? '⚠ Supera il budget' : 'Nei limiti'}
        />
      </div>

      {/* Tabs: Allocazioni / Alert */}
      <Card className={styles.headerCard}>
        <Tabs
          defaultActiveKey="allocations"
          items={[
            {
              key: 'allocations',
              label: `Allocazioni (${project.allocations.length})`,
              children: (
                <Table
                  dataSource={project.allocations}
                  columns={allocColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><Text strong>Totale</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right"><Text strong>{kpi.oreTotaliAllocate}h</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={2} align="right"><Text strong>{kpi.oreTotaliConsuntivate}h</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={3} />
                      <Table.Summary.Cell index={4} />
                      <Table.Summary.Cell index={5} align="right">
                        <Text strong>€{kpi.ricavoRiconosciuto.toLocaleString('it-IT')}</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                />
              ),
            },
            {
              key: 'alerts',
              label: (
                <span>
                  Alert {projectAlerts.length > 0 && <Tag color="error" className={styles.alertTag}>{projectAlerts.length}</Tag>}
                </span>
              ),
              children: projectAlerts.length > 0
                ? <Table dataSource={projectAlerts} columns={alertColumns} rowKey="id" pagination={false} size="small" />
                : <Text type="secondary">Nessun alert attivo per questo progetto.</Text>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
