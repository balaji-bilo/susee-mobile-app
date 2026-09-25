import React, { useRef, useState } from 'react';
import { Animated, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { colors, fonts, radius, spacing } from '../styles/theme';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading: externalLoading,
  disabled,
  style,
  fullWidth,
}) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const scale = useRef(new Animated.Value(1)).current;

  const backgroundColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'secondary'
        ? colors.primarySoft
        : variant === 'danger'
          ? colors.danger
          : 'transparent';

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? colors.primaryDeep
        : colors.primary;

  const borderColor = variant === 'ghost' ? 'transparent' : colors.border;

  const {
    alignSelf,
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    flex,
    position,
    top,
    bottom,
    left,
    right,
    width,
    ...innerStyle
  } = style || {};

  const handlePress = async (event) => {
    if (!onPress || loading || disabled) return;
    const result = onPress(event);
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } catch (err) {
        console.error('Button onPress async handler error:', err);
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      onPressIn={() => {
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
      }}
      onPressOut={() => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      }}
      style={[
        {
          opacity: disabled || loading ? 0.55 : 1,
          alignSelf: alignSelf || (fullWidth ? 'stretch' : 'flex-start'),
          margin,
          marginTop,
          marginBottom,
          marginLeft,
          marginRight,
          marginHorizontal,
          marginVertical,
          flex,
          position,
          top,
          bottom,
          left,
          right,
          width,
        },
      ]}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            minHeight: 46,
            paddingHorizontal: spacing.xl,
            borderRadius: radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor,
            borderWidth: 1,
            borderColor,
            alignSelf: 'stretch',
          },
          innerStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <Text style={{ color: textColor, fontFamily: fonts.inter, fontSize: 14 }}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}
