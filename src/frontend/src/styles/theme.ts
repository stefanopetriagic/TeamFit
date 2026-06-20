import type { ThemeConfig } from 'antd';

const primaryColor = '#1A56E8';
const borderRadius = 6;

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: primaryColor,
    colorBgLayout: '#F4F6F9',
    colorBgContainer: '#FFFFFF',
    colorBorderSecondary: '#E8ECF0',
    borderRadius,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: '#0F1C3F',
      triggerBg: '#162247',
    },
    Menu: {
      darkItemBg: '#0F1C3F',
      darkSubMenuItemBg: '#162247',
      darkItemSelectedBg: '#1A56E8',
      darkItemColor: '#A8B8D8',
      darkItemHoverColor: '#FFFFFF',
      darkItemSelectedColor: '#FFFFFF',
    },
    Table: {
      headerBg: '#F8FAFC',
      borderColor: '#E8ECF0',
    },
    Card: {
      boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#4B7FFF',
    colorBgLayout: '#0D1117',
    colorBgContainer: '#161B22',
    colorBorderSecondary: '#30363D',
    borderRadius,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontSize: 14,
  },
  components: {
    Layout: {
      siderBg: '#0A0F1E',
      triggerBg: '#0D1527',
    },
    Menu: {
      darkItemBg: '#0A0F1E',
      darkSubMenuItemBg: '#0D1527',
      darkItemSelectedBg: '#4B7FFF',
      darkItemColor: '#8B9EC7',
      darkItemHoverColor: '#FFFFFF',
      darkItemSelectedColor: '#FFFFFF',
    },
    Table: {
      headerBg: '#1C2230',
      borderColor: '#30363D',
    },
    Card: {
      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
    },
  },
};
