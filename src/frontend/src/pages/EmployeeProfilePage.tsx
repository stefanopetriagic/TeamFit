import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Progress, Space, theme } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import {
  PROJECTS, ALLOCATIONS, employeeById, figureByCode, customerById, calcKpi,
} from '../mocks/data';
import type { Project } from '../types/project';
import { KpiCard } from '../components/KpiCard';
import { StatusTag } from '../components/StatusTag';
import { BudgetProgress } from '../components/BudgetProgress';
import styles from './EmployeeProfilePage.module.css';

const { Text } = Typography;

const FIGURE_COLORS: Record<string, string> = {
  F: '#1A56E8', E: '#0BA5EC', D: '#12B76A', C: '#F79009', B: '#F79009', A: '#98A2B3',
};

export function EmployeeProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();

  const employee = employeeById[id ?? ''];
  if (!employee) return <div>Dipendente non trovato.</div>;

  const figure = figureByCode[employee.figureCode];
  const empAllocs = ALLOCATIONS.filter(a => a.employeeId === employee.id);
  const projectIds = [...new Set(empAllocs.map(a => a.projectId))];
  const projects = PROJECTS.filter(p => projectIds.includes(p.id));

  const totalAllocated = empAllocs.reduce((s, a) => s + a.oreAllocate, 0);
  const totalConsumed = empAllocs.reduce((s, a) => s + a.oreConsuntivate, 0);
  const utilization = totalAllocated > 0 ? (totalConsumed / totalAllocated) * 100 : 0;
  const totalRicavo = empAllocs.reduce((s, a) => {
    const fig = figureByCode[a.figureCode];
    return s + (fig ? a.oreConsuntivate * fig.tariffaVenditaOraria : 0);
  }, 0);

  const initials = `${employee.nome.charAt(0)}${employee.cognome.charAt(0)}`;
  const avatarColor = FIGURE_COLORS[employee.figureCode] ?? '#98A2B3';

  const projectColumns = [
    {
      title: 'Progetto',
      render: (_: unknown, rec: Project) => (
        <div>
          <Text
            strong
            className={styles.projectLink}
            style={{ color: token.colorPrimary }}
            onClick={() => navigate(`/clienti/${rec.customerId}/progetti/${rec.id}`)}
          >
            {rec.nome}
          </Text>
          <br />
          <span className={styles.projectCode}>{rec.code}</span>
        </div>
      ),
    },
    { title: 'Cliente', render: (_: unknown, rec: Project) => <Text>{customerById[rec.customerId]?.ragioneSociale}</Text> },
    { title: 'Stato', dataIndex: 'status', render: (v: string) => <StatusTag status={v as Project['status']} /> },
    {
      title: 'Ore allocate',
      render: (_: unknown, rec: Project) => {
        const a = empAllocs.find(al => al.projectId === rec.id);
        return <Text>{a?.oreAllocate ?? 0}h</Text>;
      },
      align: 'right' as const,
    },
    {
      title: 'Ore consuntivate',
      render: (_: unknown, rec: Project) => {
        const a = empAllocs.find(al => al.projectId === rec.id);
        return <Text>{a?.oreConsuntivate ?? 0}h</Text>;
      },
      align: 'right' as const,
    },
    {
      title: 'Avanzamento',
      render: (_: unknown, rec: Project) => {
        const a = empAllocs.find(al => al.projectId === rec.id);
        if (!a) return null;
        const pct = a.oreAllocate > 0 ? (a.oreConsuntivate / a.oreAllocate) * 100 : 0;
        const color = pct > 100 ? '#F04438' : pct > 80 ? '#F79009' : '#12B76A';
        return <Progress percent={Math.min(Math.round(pct), 100)} size="small" strokeColor={color} showInfo className={styles.progressNoMargin} />;
      },
      width: 160,
    },
    {
      title: 'Budget progetto %',
      render: (_: unknown, rec: Project) => <BudgetProgress pct={calcKpi(rec).budgetConsumatoPct} />,
      width: 160,
    },
  ];

  return (
    <div className={styles.page}>
      <span className={styles.backLink} style={{ color: token.colorTextSecondary }} onClick={() => navigate('/enterprise')}>
        <ArrowLeftOutlined /> Enterprise
      </span>

      {/* Header */}
      <Card
        className={styles.headerCard}
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.headerBanner} />
        <div className={styles.headerContent}>
          <div className={styles.avatarCircle} style={{ background: avatarColor }}>
            {initials}
          </div>
          <div className={styles.infoArea}>
            <div className={styles.employeeName}>
              {employee.nome} {employee.cognome}
            </div>
            <Space size={8} wrap>
              <Tag color={avatarColor} className={styles.figureBold}>Figura {employee.figureCode}</Tag>
              <Tag>{figure?.nome ?? ''}</Tag>
              <Tag>{employee.dipartimento}</Tag>
            </Space>

            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}><MailOutlined /> Email</span>
                <Text copyable className={styles.emailText}>{employee.email}</Text>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Costo orario</span>
                <span className={styles.metaValue}>€ {figure?.costoOrario ?? '–'}/h</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tariffa vendita</span>
                <span className={styles.metaValue}>€ {figure?.tariffaVenditaOraria ?? '–'}/h</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}><CalendarOutlined /> Data assunzione</span>
                <span className={styles.metaValue}>
                  {new Date(employee.dataAssunzione).toLocaleDateString('it-IT')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Progetti totali"
          value={projects.length}
          accentColor="#1A56E8"
          trend={`${projects.filter(p => p.status === 'Active').length} attivi`}
        />
        <KpiCard
          label="Ore Consuntivate"
          value={`${totalConsumed}h`}
          accentColor="#0BA5EC"
          trend={`su ${totalAllocated}h allocate — ${utilization.toFixed(0)}% utilizzo`}
        />
        <KpiCard
          label="Ricavo Generato"
          value={`€ ${totalRicavo.toLocaleString('it-IT')}`}
          accentColor="#12B76A"
        />
      </div>

      {/* Projects table */}
      <Card
        title={`Progetti (${projects.length})`}
        className={styles.headerCard}
      >
        <Table
          dataSource={projects}
          columns={projectColumns}
          rowKey="id"
          pagination={false}
          size="middle"
          onRow={rec => ({ onDoubleClick: () => navigate(`/clienti/${rec.customerId}/progetti/${rec.id}`) })}
        />
      </Card>
    </div>
  );
}
