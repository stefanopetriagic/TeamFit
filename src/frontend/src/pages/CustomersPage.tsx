import type { JSX } from 'react';
import { Card, Table, Tag, Typography, Input, Button, Space, Avatar, theme } from 'antd';
import { SearchOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CUSTOMERS } from '../mocks/data';
import type { Customer } from '../types/customer';
import { RoleGuard } from '../components/RoleGuard';
import styles from './CustomersPage.module.css';

const { Text } = Typography;

const SECTOR_COLORS: Record<string, string> = {
  Tecnologia: 'blue',
  Finanza: 'gold',
  Retail: 'green',
};

export function CustomersPage(): JSX.Element {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(c =>
    c.ragioneSociale.toLowerCase().includes(search.toLowerCase()) ||
    c.codice.toLowerCase().includes(search.toLowerCase()) ||
    c.settore.toLowerCase().includes(search.toLowerCase()),
  );

  const columns = [
    {
      title: 'Cliente',
      dataIndex: 'ragioneSociale',
      render: (name: string, rec: Customer) => (
        <Space>
          <Avatar className={styles.customerAvatar} style={{ background: token.colorPrimary }} size={36}>
            {name.charAt(0)}
          </Avatar>
          <div>
            <Text strong className={styles.projectLink} style={{ color: token.colorPrimary }}
              onClick={() => navigate(`/clienti/${rec.id}`)}>
              {name}
            </Text>
            <span className={styles.customerCode}>{rec.codice}</span>
          </div>
        </Space>
      ),
    },
    {
      title: 'Settore',
      dataIndex: 'settore',
      render: (v: string) => <Tag color={SECTOR_COLORS[v] ?? 'default'}>{v}</Tag>,
    },
    { title: 'Città', dataIndex: 'citta' },
    { title: 'Referente', dataIndex: 'referente' },
    { title: 'Contatto', dataIndex: 'email', render: (v: string) => <Text copyable className={styles.emailText}>{v}</Text> },
    {
      title: 'Progetti',
      render: (_: unknown, rec: Customer) => (
        <Space>
          <Tag color="processing">{rec.activeProjectCount} attivi</Tag>
          <Text type="secondary" className={styles.projectCount}>{rec.projectCount} totali</Text>
        </Space>
      ),
    },
    {
      title: '',
      render: (_: unknown, rec: Customer) => (
        <Button
          type="text"
          icon={<RightOutlined />}
          onClick={() => navigate(`/clienti/${rec.id}`)}
        />
      ),
      width: 48,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Clienti</div>
          <div className={styles.pageSubtitle}>{CUSTOMERS.length} clienti registrati</div>
        </div>
        <RoleGuard roles={['ADMIN', 'MANAGER']} fallback={null}>
          <Button type="primary" icon={<PlusOutlined />}>Nuovo cliente</Button>
        </RoleGuard>
      </div>

      <Card
        className={styles.card}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Cerca per nome, codice o settore..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
          allowClear
        />
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `${t} clienti` }}
          size="middle"
          onRow={rec => ({ onDoubleClick: () => navigate(`/clienti/${rec.id}`) })}
        />
      </Card>
    </div>
  );
}
