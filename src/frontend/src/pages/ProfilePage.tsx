import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Avatar, theme } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  PROJECTS, ALLOCATIONS, employeeById, figureByCode, customerById, calcKpi,
} from '../mocks/data';
import type { Project } from '../types/project';
import { KpiCard } from '../components/KpiCard';
import { StatusTag } from '../components/StatusTag';
import { BudgetProgress } from '../components/BudgetProgress';
import styles from './ProfilePage.module.css';

const { Text } = Typography;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  PROJECT_MANAGER: 'Project Manager',
  PRESALES: 'Presales',
};

export function ProfilePage(): JSX.Element {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { token } = theme.useToken();

  if (!currentUser) return <div>Non autenticato.</div>;

  const employee = currentUser.employeeId ? employeeById[currentUser.employeeId] : null;
  const figure = employee ? figureByCode[employee.figureCode] : null;

  // Projects this user is involved with (as PM or Presales)
  const myProjects = PROJECTS.filter(p =>
    p.pmId === currentUser.id || p.presalesId === currentUser.id,
  );

  // Allocations if they have an employee record
  const myAllocs = employee
    ? ALLOCATIONS.filter(a => a.employeeId === employee.id)
    : [];
  const allocatedProjectIds = new Set(myAllocs.map(a => a.projectId));
  const allMyProjects = [
    ...myProjects,
    ...PROJECTS.filter(p => allocatedProjectIds.has(p.id) && !myProjects.some(mp => mp.id === p.id)),
  ];

  const totalAllocated = myAllocs.reduce((s, a) => s + a.oreAllocate, 0);
  const totalConsumed = myAllocs.reduce((s, a) => s + a.oreConsuntivate, 0);

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
      title: 'Ruolo',
      render: (_: unknown, rec: Project) => {
        const tags = [];
        if (rec.pmId === currentUser.id) tags.push(<Tag color="blue" key="pm">PM</Tag>);
        if (rec.presalesId === currentUser.id) tags.push(<Tag color="green" key="ps">Presales</Tag>);
        if (allocatedProjectIds.has(rec.id) && !tags.length) tags.push(<Tag key="res">Risorsa</Tag>);
        return <>{tags}</>;
      },
    },
    {
      title: 'Budget %',
      render: (_: unknown, rec: Project) => <BudgetProgress pct={calcKpi(rec).budgetConsumatoPct} />,
      width: 160,
    },
    {
      title: 'Margine',
      render: (_: unknown, rec: Project) => {
        const kpi = calcKpi(rec);
        const color = kpi.marginePct < 10 ? '#F04438' : kpi.marginePct < 20 ? '#F79009' : '#12B76A';
        return <Text className={styles.marginValue} style={{ color }}>{kpi.marginePct.toFixed(1)}%</Text>;
      },
    },
    { title: 'Data fine', dataIndex: 'dataFine', render: (v: string) => new Date(v).toLocaleDateString('it-IT') },
  ];

  return (
    <div className={styles.page}>
      {/* Header banner card */}
      <Card
        className={styles.headerCard}
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.banner} />
        <div className={styles.headerBody}>
          <div className={styles.avatarWrap}>
            <Avatar
              size={64}
              className={styles.headerAvatar}
              style={{
                background: token.colorPrimary,
                border: `3px solid ${token.colorBgContainer}`,
              }}
            >
              {currentUser.avatarInitials}
            </Avatar>
          </div>

          <div className={styles.userName}>
            {currentUser.nome} {currentUser.cognome}
          </div>
          <div className={styles.roleBadge}>
            <Tag color="blue">{ROLE_LABELS[currentUser.role]}</Tag>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}><MailOutlined /> Email</span>
              <Text copyable className={styles.emailText}>{currentUser.email}</Text>
            </div>
            {employee && (
              <>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Figura professionale</span>
                  <span className={styles.metaValue}>
                    {employee.figureCode} — {figure?.nome ?? ''}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Dipartimento</span>
                  <span className={styles.metaValue}>{employee.dipartimento}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* KPI */}
      <div className={styles.kpiGrid}>
        <KpiCard
          label="Progetti seguiti"
          value={allMyProjects.length}
          accentColor="#1A56E8"
          trend={`${allMyProjects.filter(p => p.status === 'Active').length} attivi`}
        />
        <KpiCard
          label="Ore Consuntivate"
          value={`${totalConsumed}h`}
          accentColor="#0BA5EC"
          trend={totalAllocated > 0 ? `su ${totalAllocated}h allocate` : 'Nessuna allocazione'}
        />
        <KpiCard
          label="Clienti coinvolti"
          value={new Set(allMyProjects.map(p => p.customerId)).size}
          accentColor="#12B76A"
        />
      </div>

      {/* Projects table */}
      <Card
        title={`I miei progetti (${allMyProjects.length})`}
        className={styles.headerCard}
      >
        {allMyProjects.length > 0
          ? (
            <Table
              dataSource={allMyProjects}
              columns={projectColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              onRow={rec => ({ onDoubleClick: () => navigate(`/clienti/${rec.customerId}/progetti/${rec.id}`) })}
            />
          )
          : <Text type="secondary">Nessun progetto associato al tuo account.</Text>}
      </Card>
    </div>
  );
}
