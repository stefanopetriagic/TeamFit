import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Button, Space, Statistic, Divider, theme } from 'antd';
import {
  ArrowLeftOutlined, PlusOutlined, MailOutlined, PhoneOutlined,
  EnvironmentOutlined, RightOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { PROJECTS, customerById, calcKpi, ALERTS } from '../mocks/data';
import type { Project } from '../types/project';
import { BudgetProgress } from '../components/BudgetProgress';
import { StatusTag } from '../components/StatusTag';
import { RoleGuard } from '../components/RoleGuard';
import styles from './CustomerDetailPage.module.css';

const { Text } = Typography;

export function CustomerDetailPage(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { token } = theme.useToken();

  const customer = customerById[id ?? ''];
  if (!customer) return <div>Cliente non trovato.</div>;

  const projects = PROJECTS.filter(p => p.customerId === customer.id);
  const activeProjects = projects.filter(p => p.status === 'Active');
  const allKpis = projects.map(p => calcKpi(p));
  const totalBudget = projects.reduce((s, p) => s + p.budgetEuro, 0);
  const totalCosto = allKpis.reduce((s, k) => s + k.costoSostenuto, 0);
  const customerAlerts = ALERTS.filter(a => projects.some(p => p.id === a.projectId));

  const columns = [
    {
      title: 'Progetto',
      render: (_: unknown, rec: Project) => (
        <div>
          <Text
            strong
            className={styles.projectLinkBlock}
            style={{ color: token.colorPrimary }}
            onClick={() => navigate(`/clienti/${customer.id}/progetti/${rec.id}`)}
          >
            {rec.nome}
          </Text>
          <span className={styles.projectCode}>{rec.code}</span>
        </div>
      ),
    },
    { title: 'Stato', dataIndex: 'status', render: (v: string) => <StatusTag status={v as Project['status']} /> },
    {
      title: 'Budget €',
      dataIndex: 'budgetEuro',
      render: (v: number) => <Text>€ {v.toLocaleString('it-IT')}</Text>,
      align: 'right' as const,
    },
    {
      title: 'Consumato',
      render: (_: unknown, rec: Project) => {
        const kpi = calcKpi(rec);
        return <BudgetProgress pct={kpi.budgetConsumatoPct} />;
      },
      width: 160,
    },
    {
      title: 'Margine %',
      render: (_: unknown, rec: Project) => {
        const kpi = calcKpi(rec);
        const color = kpi.marginePct < 10 ? '#F04438' : kpi.marginePct < 20 ? '#F79009' : '#12B76A';
        return <Text className={styles.marginValue} style={{ color }}>{kpi.marginePct.toFixed(1)}%</Text>;
      },
    },
    { title: 'Data inizio', dataIndex: 'dataInizio', render: (v: string) => new Date(v).toLocaleDateString('it-IT') },
    { title: 'Data fine', dataIndex: 'dataFine', render: (v: string) => new Date(v).toLocaleDateString('it-IT') },
    {
      title: 'Alert',
      render: (_: unknown, rec: Project) => {
        const count = customerAlerts.filter(a => a.projectId === rec.id).length;
        return count > 0 ? <Tag color="error">{count}</Tag> : <Tag color="default">–</Tag>;
      },
    },
    {
      title: '',
      render: (_: unknown, rec: Project) => (
        <Button type="text" icon={<RightOutlined />} onClick={() => navigate(`/clienti/${customer.id}/progetti/${rec.id}`)} />
      ),
      width: 48,
    },
  ];

  return (
    <div className={styles.page}>
      <span className={styles.backLink} style={{ color: token.colorTextSecondary }} onClick={() => navigate('/clienti')}>
        <ArrowLeftOutlined /> Clienti
      </span>

      {/* Header card */}
      <Card
        className={styles.headerCard}
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.headerBanner} />
        <div className={styles.bodyPad}>
          <div className={styles.headerContent}>
            <Space align="start" size={20}>
              <div className={styles.customerAvatar} style={{ background: token.colorPrimary }}>
                {customer.ragioneSociale.charAt(0)}
              </div>
              <div>
                <div className={styles.customerName}>{customer.ragioneSociale}</div>
                <Tag color="blue" className={styles.sectorTag}>{customer.settore}</Tag>
                <Tag>{customer.codice}</Tag>
                <div className={styles.customerMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Referente</span>
                    <span className={styles.metaValue}>{customer.referente}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><MailOutlined /> Email</span>
                    <Text copyable className={styles.emailText}>{customer.email}</Text>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><PhoneOutlined /> Telefono</span>
                    <span className={styles.metaValue}>{customer.telefono}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}><EnvironmentOutlined /> Città</span>
                    <span className={styles.metaValue}>{customer.citta}</span>
                  </div>
                </div>
              </div>
            </Space>

            <div className={styles.statsRow}>
              <div className={styles.statBox} style={{ background: token.colorPrimaryBg }}>
                <div className={styles.statNumber} style={{ color: token.colorPrimary }}>{activeProjects.length}</div>
                <div className={styles.statLabel}>{"Attivi"}</div>
              </div>
              <div className={styles.statBox} style={{ background: token.colorFillAlter }}>
                <div className={styles.statNumber}>{projects.length}</div>
                <div className={styles.statLabel}>{"Totali"}</div>
              </div>
              <div className={styles.statBox} style={{ background: customerAlerts.length > 0 ? '#FFF1F0' : token.colorFillAlter }}>
                <div className={styles.statNumber} style={{ color: customerAlerts.length > 0 ? '#F04438' : undefined }}>{customerAlerts.length}</div>
                <div className={styles.statLabel}>{"Alert"}</div>
              </div>
            </div>
          </div>

          <Divider className={styles.headerDivider} />

          <Space size={32}>
            <Statistic title="Budget totale" value={totalBudget} prefix="€" formatter={(v) => Number(v).toLocaleString('it-IT')} />
            <Statistic title="Costo sostenuto" value={totalCosto} prefix="€" formatter={(v) => Number(v).toLocaleString('it-IT')} />
            <Statistic
              title="Write-up complessivo"
              value={totalBudget - totalCosto}
              prefix="€"
              formatter={(v) => Number(v).toLocaleString('it-IT')}
              valueStyle={{ color: (totalBudget - totalCosto) >= 0 ? '#12B76A' : '#F04438' }}
            />
          </Space>
        </div>
      </Card>

      {/* Projects table */}
      <Card
        title={`Progetti (${projects.length})`}
        className={styles.headerCard}
        extra={
          <RoleGuard roles={['ADMIN', 'MANAGER']} fallback={null}>
            <Button type="primary" size="small" icon={<PlusOutlined />}>Nuovo progetto</Button>
          </RoleGuard>
        }
      >
        <Table
          dataSource={projects}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          onRow={rec => ({ onDoubleClick: () => navigate(`/clienti/${customer.id}/progetti/${rec.id}`) })}
        />
      </Card>
    </div>
  );
}
