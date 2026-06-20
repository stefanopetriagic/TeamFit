import type { JSX } from 'react';
import { Layout, Menu, Badge, Switch, Avatar, Dropdown, theme as antTheme } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  BankOutlined,
  SettingOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useOrgConfigStore } from '../store/orgConfigStore';
import { useChatStore } from '../store/chatStore';
import { ALERTS } from '../mocks/data';
import { AIChatbot } from './AIChatbot';
import styles from './AppLayout.module.css';

const { Sider, Header, Content } = Layout;

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  PROJECT_MANAGER: 'Project Manager',
  PRESALES: 'Presales',
};

export function AppLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuthStore();
  const { mode, toggle } = useThemeStore();
  const { resetConfig } = useOrgConfigStore();
  const { isOpen, toggleOpen } = useChatStore();
  const { token } = antTheme.useToken();

  const openAlertCount = ALERTS.length;

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/clienti', icon: <TeamOutlined />, label: 'Clienti' },
    { key: '/enterprise', icon: <BankOutlined />, label: 'Enterprise' },
    { key: '/alerts', icon: <BellOutlined />, label: <Badge count={openAlertCount} size="small" offset={[6, 0]}>Alert</Badge> },
  ];

  const selectedKey = menuItems
    .map(m => m.key)
    .sort((a, b) => b.length - a.length)
    .find(k => location.pathname.startsWith(k)) ?? '/';

  const userMenuItems = [
    { key: 'profilo', icon: <UserOutlined />, label: 'Il mio profilo', onClick: () => navigate('/profilo') },
    {
      key: 'configurazione',
      icon: <SettingOutlined />,
      label: 'Riconfigura organizzazione',
      onClick: () => { resetConfig(); navigate('/configurazione'); },
    },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Esci', danger: true, onClick: () => { logout(); navigate('/login'); } },
  ];

  return (
    <Layout className={styles.layout}>
      <Sider width={220} className={styles.sider} theme="dark">
        <div className={styles.logo}>
          <div className={styles.logoIcon}>M</div>
          <div>
            <div className={styles.logoText}>Man-Agent</div>
            <div className={styles.logoSub}>Project Intelligence</div>
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          className={styles.menu}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />

        {/* AI Agent entry at bottom of sider */}
        <div className={styles.siderBottom}>
          <button
            className={`${styles.agentBtn} ${isOpen ? styles.agentBtnActive : ''}`}
            onClick={toggleOpen}
          >
            <RobotOutlined className={styles.agentBtnIcon} />
            <span className={styles.agentBtnLabel}>AI Agent</span>
          </button>
        </div>
      </Sider>

      <Layout className={`${styles.mainLayout} ${isOpen ? styles.mainLayoutShifted : ''}`}>
        <Header
          className={styles.header}
          style={{
            background: token.colorBgContainer,
            borderBottomColor: token.colorBorderSecondary,
          }}
        >
          <div className={styles.headerLeft} />

          <div className={styles.headerRight}>
            <div className={styles.themeToggle}>
              <SunOutlined className={styles.themeIcon} style={{ opacity: mode === 'light' ? 1 : 0.4 }} />
              <Switch size="small" checked={mode === 'dark'} onChange={toggle} />
              <MoonOutlined className={styles.themeIcon} style={{ opacity: mode === 'dark' ? 1 : 0.4 }} />
            </div>

            <Badge count={openAlertCount} size="small">
              <BellOutlined
                className={`${styles.alertBadge} ${styles.bellIcon}`}
                onClick={() => navigate('/alerts')}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div className={styles.userMenu}>
                <Avatar size={32} className={styles.headerAvatar} style={{ background: token.colorPrimary }}>
                  {currentUser?.avatarInitials ?? 'U'}
                </Avatar>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{currentUser?.nome} {currentUser?.cognome}</span>
                  <span className={styles.userRole}>{ROLE_LABELS[currentUser?.role ?? ''] ?? ''}</span>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content className={styles.content}>
          <Outlet />
        </Content>
      </Layout>

      <AIChatbot />
    </Layout>
  );
}

