import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, FONTS } from '../config/theme';

export default function CustomButton({ title, onPress, variant = 'primary', style, loading: externalLoading, disabled = false }) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const isSecondary = variant === 'secondary';

  const handlePress = async (event) => {
    if (!onPress || loading || disabled) return;
    const result = onPress(event);
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } catch (err) {
        console.error('CustomButton onPress async handler error:', err);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={loading || disabled}
      style={[
        styles.button,
        isSecondary ? styles.secondary : styles.primary,
        (loading || disabled) && { opacity: 0.7 },
        style
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={isSecondary ? COLORS.primary : COLORS.card} />
      ) : (
        <Text style={[styles.label, isSecondary && styles.secondaryLabel]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primary: { backgroundColor: COLORS.primary },
  secondary: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: 15, fontFamily: FONTS.inter, color: COLORS.card },
  secondaryLabel: { color: COLORS.secondary },
});
