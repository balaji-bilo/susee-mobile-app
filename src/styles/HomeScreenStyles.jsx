import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../config/theme';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, padding: 16, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  avatarMini: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { color: '#FFFFFF', fontSize: 16, fontFamily: FONTS.inter },
  welcomeText: { color: COLORS.muted, fontSize: 12, fontFamily: FONTS.inter },
  staffName: { color: COLORS.secondary, fontSize: 18, fontFamily: FONTS.inter },
  sectionTitle: { color: COLORS.secondary, fontSize: 16, fontFamily: FONTS.inter, marginBottom: 12, marginTop: 4 },
  actionGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: { flex: 1, height: 130, borderRadius: 24, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 5 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, letterSpacing: 0.5, fontFamily: FONTS.inter },
  actionBtnDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontFamily: FONTS.inter, marginTop: 4 },
  cardGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  activityFeed: { gap: 12 },
  activityItem: { backgroundColor: COLORS.card, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  typeBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  typeIconText: { fontSize: 16, fontFamily: FONTS.inter },
  activityMain: { flex: 1 },
  activityLabel: { color: COLORS.secondary, fontSize: 14, fontFamily: FONTS.inter },
  activityMeta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusTagText: { fontSize: 10, fontFamily: FONTS.inter, textTransform: 'uppercase' },
});
