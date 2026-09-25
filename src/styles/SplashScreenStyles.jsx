import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../config/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 250, height: 250, marginBottom: 20 },
  title: { color: COLORS.secondary, fontSize: 28, marginBottom: 6, fontFamily: FONTS.inter },
  subtitle: { color: COLORS.text, fontSize: 14, textAlign: 'center', marginBottom: 16, paddingHorizontal: 32, fontFamily: FONTS.inter },
  version: { color: COLORS.secondary, fontSize: 12, marginTop: 8, fontFamily: FONTS.inter },
});
