import type { JSX } from 'react';
import { Card, Select, Button, Typography, theme } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { USERS } from '../mocks/data';
import styles from './LoginPage.module.css';

const { Text } = Typography;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  PROJECT_MANAGER: 'Project Manager',
  PRESALES: 'Presales',
};

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuthStore();
  const { token } = theme.useToken();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleLogin(): void {
    const user = USERS.find(u => u.id === selectedId);
    if (!user) return;
    setCurrentUser(user);
    navigate('/');
  }

  const options = USERS.map(u => ({
    value: u.id,
    label: (
      <div className={styles.optionRow}>
        <span>{u.nome} {u.cognome}</span>
        <Text type="secondary" className={styles.optionRole}>{ROLE_LABELS[u.role]}</Text>
      </div>
    ),
  }));

  return (
    <div className={styles.page} style={{ background: token.colorBgLayout }}>
      <Card
        className={styles.card}
        styles={{ body: { padding: '40px 36px 32px' } }}
      >
        <div className={styles.header}>
          <div className={styles.logoWrap}>M</div>
          <div className={styles.title}>Man-Agent</div>
          <div className={styles.subtitle}>Project Intelligence Platform</div>
        </div>

        <div className={styles.labelWrap}>
          <Text className={styles.labelText}>
            Accedi come
          </Text>
        </div>

        <Select
          className={styles.selectFull}
          size="large"
          placeholder="Seleziona utente..."
          options={options}
          value={selectedId}
          onChange={setSelectedId}
          optionLabelProp="label"
        />

        <Button
          type="primary"
          size="large"
          block
          disabled={!selectedId}
          onClick={handleLogin}
        >
          Accedi
        </Button>

        <div className={styles.footer}>
          Ambiente demo — autenticazione mock
        </div>
      </Card>
    </div>
  );
}
