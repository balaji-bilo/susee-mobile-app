import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../config/theme';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: -28,
    right: -28,
    height: 200,
  },
  lottieContainer: {
    position: 'absolute',
    top: 195,
    left: 0,
    right: 0,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  lottie: {
    width: 250,
    height: 160,
  },
  formContainer: {
    marginTop: 270,
  },
  titleContainer: {
    marginBottom: 28,
  },
  title: { color: COLORS.secondary, fontSize: 32, fontFamily: FONTS.inter },
  titleUnderline: { width: 50, height: 4, backgroundColor: COLORS.primary, marginTop: 6, borderRadius: 2 },
  forgotButton: {
    alignSelf: 'flex-end',
  },
  forgotText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.inter, textAlign: 'right', marginTop: 4, marginBottom: 24 },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  footerText: { color: COLORS.muted, fontSize: 13, fontFamily: FONTS.inter},
  footerLink: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.inter},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.inter,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.inter,
    color: COLORS.muted,
    marginBottom: 20,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
  },
  cancelButtonText: {
    color: COLORS.muted,
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
});
