import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Input, Select, Avatar, Progress, Space, theme } from 'antd';
import { SearchOutlined, RightOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EMPLOYEES, PROJECTS, ALLOCATIONS, FIGURES, figureByCode } from '../mocks/data';
import { KpiCard } from '../components/KpiCard';
import styles from './EnterprisePage.module.css';

const { Text } = Typography;

const DEPT_COLORS: Record<string, string> = {
  Management: 'purple',
  Delivery: 'blue',
  Presales: 'green',
};

const FIGURE_COLORS: Record<string, string> = {
  F: '#1A56E8', E: '#0BA5EC', D: '#12B76A', C: '#F79009', B: '#F79009', A: '#98A2B3',
};

export function EnterprisePage(): JSX.Element {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [figureFilter, setFigureFilter] = useState<string | null>(null);

  // Per each employee, compute active projects count and total hours
  const employeeStats = EMPLOYEES.map(emp => {
    const empAllocs = ALLOCATIONS.filter(a => a.employeeId === emp.id);
    const activeProjectIds = new Set(
      PROJECTS.filter(p => p.status === 'Active').map(p => p.id),
    );
    const activeAllocs = empAllocs.filter(a => activeProjectIds.has(a.projectId));
    const totalAllocated = empAllocs.reduce((s, a) => s + a.oreAllocate, 0);
    const totalConsumed = empAllocs.reduce((s, a) => s + a.oreConsuntivate, 0);
    const activeProjects = new Set(activeAllocs.map(a => a.projectId)).size;
    const utilizationPct = totalAllocated > 0 ? (totalConsumed / totalAllocated) * 100 : 0;
    return { emp, totalAllocated, totalConsumed, activeProjects, utilizationPct };
  });

  const departments = [...new Set(EMPLOYEES.map(e => e.dipartimento))];
  const figCodes = FIGURES.map(f => f.code);

  const filtered = employeeStats.filter(({ emp }) => {
    const q = search.toLowerCase();
    const matchSearch = `${emp.nome} ${emp.cognome}`.toLowerCase().includes(q) || emp.email.toLowerCase().includes(q);
    const matchDept = !deptFilter || emp.dipartimento === deptFilter;
    const matchFig = !figureFilter || emp.figureCode === figureFilter;
    return matchSearch && matchDept && matchFig;
  });

  const totalHeadcount = EMPLOYEES.length;
  const activeCount = employeeStats.filter(s => s.activeProjects > 0).length;
  const avgUtilization = employeeStats.reduce((s, e) => s + e.utilizationPct, 0) / employeeStats.length;

  const columns = [
    {
      title: 'Dipendente',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <Space>
          <Avatar size={36} className={styles.employeeAvatar} style={{ background: FIGURE_COLORS[rec.emp.figureCode] ?? '#ccc' }}>
            {rec.emp.nome.charAt(0)}{rec.emp.cognome.charAt(0)}
          </Avatar>
          <div>
            <Text
              className={styles.employeeName}
              style={{ color: token.colorPrimary }}
              onClick={() => navigate(`/enterprise/${rec.emp.id}`)}
            >
              {rec.emp.nome} {rec.emp.cognome}
            </Text>
            <br />
            <Text type="secondary" className={styles.emailText}>{rec.emp.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Figura',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <Tag color={FIGURE_COLORS[rec.emp.figureCode] ?? '#ccc'} className={styles.figureTag}>
          {rec.emp.figureCode} — {figureByCode[rec.emp.figureCode]?.nome ?? ''}
        </Tag>
      ),
    },
    {
      title: 'Dipartimento',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <Tag color={DEPT_COLORS[rec.emp.dipartimento] ?? 'default'}>{rec.emp.dipartimento}</Tag>
      ),
    },
    {
      title: 'Costo/h',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <Text>€ {figureByCode[rec.emp.figureCode]?.costoOrario ?? '–'}</Text>
      ),
      align: 'right' as const,
    },
    {
      title: 'Tariffa/h',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <Text>€ {figureByCode[rec.emp.figureCode]?.tariffaVenditaOraria ?? '–'}</Text>
      ),
      align: 'right' as const,
    },
    {
      title: 'Progetti attivi',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <Text strong>{rec.activeProjects}</Text>
      ),
      align: 'center' as const,
    },
    {
      title: 'Utilizzo',
      render: (_: unknown, rec: typeof employeeStats[0]) => {
        const color = rec.utilizationPct > 90 ? '#F04438' : rec.utilizationPct > 60 ? '#F79009' : '#12B76A';
        return (
          <div className={styles.allocationBar}>
            <Progress percent={Math.min(Math.round(rec.utilizationPct), 100)} size="small" strokeColor={color} showInfo />
            <Text type="secondary" className={styles.hoursText}>{rec.totalConsumed}h / {rec.totalAllocated}h</Text>
          </div>
        );
      },
      width: 200,
    },
    {
      title: '',
      render: (_: unknown, rec: typeof employeeStats[0]) => (
        <RightOutlined className={`${styles.navArrow}`} style={{ color: token.colorPrimary }} onClick={() => navigate(`/enterprise/${rec.emp.id}`)} />
      ),
      width: 40,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Enterprise</div>
          <div className={styles.pageSubtitle}>Risorse, allocazioni e utilizzo</div>
        </div>
      </div>

      <div className={styles.statsRow}>
        <KpiCard label="Headcount" value={totalHeadcount} accentColor="#1A56E8" />
        <KpiCard label="Risorse su progetto" value={activeCount} accentColor="#12B76A" trend={`${(activeCount / totalHeadcount * 100).toFixed(0)}% del team`} />
        <KpiCard label="Utilizzo medio" value={`${avgUtilization.toFixed(0)}%`} accentColor="#F79009" />
        <KpiCard label="Figure professionali" value={FIGURES.length} accentColor="#0BA5EC" trend="A → F" />
      </div>

      <Card
        className={styles.card}
      >
        <div className={styles.filterRow}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Cerca dipendente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
            allowClear
          />
          <Select
            placeholder="Dipartimento"
            className={styles.filterSelect}
            allowClear
            value={deptFilter}
            onChange={v => setDeptFilter(v ?? null)}
            options={departments.map(d => ({ value: d, label: d }))}
          />
          <Select
            placeholder="Figura"
            className={styles.filterSelect}
            allowClear
            value={figureFilter}
            onChange={v => setFigureFilter(v ?? null)}
            options={figCodes.map(c => ({ value: c, label: `${c} — ${figureByCode[c]?.nome}` }))}
          />
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey={r => r.emp.id}
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: t => `${t} risorse` }}
          size="middle"
          onRow={rec => ({ onDoubleClick: () => navigate(`/enterprise/${rec.emp.id}`) })}
        />
      </Card>
    </div>
  );
}
