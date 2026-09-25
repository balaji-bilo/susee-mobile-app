import { StyleSheet } from 'react-native';
import { colors, fonts } from './theme';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryDeep,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rotatingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderTopColor: '#FFFFFF',
  },
  logoCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    gap: 6,
  },
  appTitle: {
    fontFamily: fonts.inter,
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  appSubtitle: {
    fontFamily: fonts.inter,
    fontSize: 13,
    color: '#93C5FD',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});

export default styles;
