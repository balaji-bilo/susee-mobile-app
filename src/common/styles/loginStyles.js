import { StyleSheet, Platform, StatusBar } from 'react-native';
import { colors, spacing, radius } from './theme';
import Fonts from '../assets/fonts/FontStyle';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  curveBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  innerContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 50,
  },
  headerTitle: {
    fontFamily: Fonts.inter,
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  lottieContainer: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: spacing.lg,
    justifyContent: 'center',
  },
  lottieView: {
    width: 200,
    height: 200,
  },
  card: {
    padding: 24,
    gap: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 6,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  cardHeader: {
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontFamily: Fonts.inter,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.5,
  },
  cardSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
  },
  inputContainer: {
    gap: spacing.md,
  },
  errorBorder: {
    borderColor: colors.danger,
  },
  errorText: {
    fontFamily: Fonts.inter,
    fontSize: 11,
    color: colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotPasswordTouch: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: colors.primary,
  },
  signInButton: {
    marginTop: spacing.xs,
    minHeight: 52,
    borderRadius: radius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    padding: 24,
    gap: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalHeader: {
    gap: 4,
  },
  modalTitle: {
    fontFamily: Fonts.inter,
    fontSize: 20,
    color: colors.text,
  },
  modalSubtitle: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: colors.mutedText,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonWrapper: {
    flex: 1,
  },
  modalButton: {
    minHeight: 48,
    borderRadius: radius.md,
  },
  bottomAccent1: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(15, 92, 150, 0.03)',
  },
  bottomAccent2: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(13, 148, 136, 0.03)',
  },
});

export default styles;
