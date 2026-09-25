import Fonts from '../assets/fonts/FontStyle';

export const colors = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FBFE',
  border: '#DCE4F2',
  text: '#1D2736',
  mutedText: '#68758C',
  primary: '#000F7E',
  primaryDeep: '#000F7E',
  primarySoft: '#eff6ff',
  success: '#1F8E57',
  successSoft: '#E5F7EE',
  warning: '#C98414',
  warningSoft: '#FFF4D8',
  danger: '#C53E4A',
  dangerSoft: '#FBE6E8',
  info: '#2E6FDB',
  shadow: 'rgba(15, 28, 48, 0.08)',
  shadowHeavy: 'rgba(15, 28, 48, 0.14)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const fonts = {
  inter: Fonts ? Fonts.inter : 'inter',
};

export const shadows = {
  card: {
    shadowColor: colors.shadowHeavy,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  subtle: {
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};
