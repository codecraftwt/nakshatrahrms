export interface ThemeColors {
  bgPage: string;
  bgSurface: string;
  bgPunchCard: string;
  primary: string;
  primaryDark: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  tabBar: string;
  tabActive: string;
  tabInactive: string;
  punchBtnBg: string;
  punchBtnText: string;
  // Status colors
  success: string;
  successBg: string;
  successText: string;
  warning: string;
  warningBg: string;
  warningText: string;
  danger: string;
  dangerBg: string;
  dangerText: string;
  info: string;
  infoBg: string;
  infoText: string;
}

const statusColors = {
  success:      '#1D9E75',
  successBg:    '#D0EDDF',
  successText:  '#0F6E56',
  warning:      '#BA7517',
  warningBg:    '#FAEEDA',
  warningText:  '#854F0B',
  danger:       '#A32D2D',
  dangerBg:     '#FCEBEB',
  dangerText:   '#A32D2D',
  info:         '#185FA5',
  infoBg:       '#E6F1FB',
  infoText:     '#185FA5',
};

const darkStatusOverrides = {
  success:      '#5DCAA5',
  warning:      '#EF9F27',
  danger:       '#E24B4A',
};

export const Colors = {
  light: {
    bgPage:        '#F5F9FF',   
    bgSurface:     '#E6F1FB',   
    bgPunchCard:   '#1558B0',   
    primary:       '#1558B0',   
    primaryDark:   '#0C447C',   
    textPrimary:   '#0D2E5A',   
    textSecondary: '#5A8FC0',   
    border:        '#B5D4F4',   
    tabBar:        '#FFFFFF',   
    tabActive:     '#1558B0',   
    tabInactive:   '#5A8FC0',   
    punchBtnBg:    '#FFFFFF',   
    punchBtnText:  '#1558B0',
    ...statusColors,
  } as ThemeColors,

  dark: {
    bgPage:        '#04142B',
    bgSurface:     '#0C2A50',
    bgPunchCard:   '#0C2A50',
    primary:       '#378ADD',
    primaryDark:   '#0C447C',
    textPrimary:   '#E6F1FB',
    textSecondary: '#5A8FC0',
    border:        '#0C447C',
    tabBar:        '#04142B',
    tabActive:     '#378ADD',
    tabInactive:   '#5A8FC0',
    punchBtnBg:    '#378ADD',
    punchBtnText:  '#FFFFFF',
    ...statusColors,
    ...darkStatusOverrides,
  } as ThemeColors,
};
