import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { colors, fonts, radius, spacing } from '../styles/theme';
import { Eye, EyeOff } from 'lucide-react-native';

export function FloatingInput({ label, value, onFocus, onBlur, containerStyle, readOnly, secureTextEntry, error, required, ...props }) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const inputRef = useRef(null);

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: focused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused, labelAnim, value]);

  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;

  return (
    <View>
      <TouchableOpacity onPress={() => inputRef.current?.focus()} activeOpacity={1} accessible={false}>
        <View
          style={[
            {
              minHeight: 58,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor,
              backgroundColor: readOnly ? colors.surfaceAlt : colors.surface,
              paddingHorizontal: spacing.md,
              justifyContent: 'center',
            },
            containerStyle,
          ]}
        >
          <Animated.View
            style={{
              position: 'absolute',
              left: spacing.md,
              top: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 7] }),
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: readOnly ? colors.surfaceAlt : colors.surface,
              paddingHorizontal: 4,
              zIndex: 1,
            }}
          >
            <Animated.Text
              style={{
                fontFamily: fonts.inter,
                fontSize: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 11] }),
                color: error
                  ? colors.danger
                  : labelAnim.interpolate({ inputRange: [0, 1], outputRange: [colors.mutedText, colors.primary] }),
              }}
            >
              {label}
            </Animated.Text>
            {required && (
              <Animated.Text
                style={{
                  fontFamily: fonts.inter,
                  fontSize: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 11] }),
                  color: colors.danger,
                  marginLeft: 2,
                }}
              >
                *
              </Animated.Text>
            )}
          </Animated.View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              ref={inputRef}
              {...props}
              value={value}
              secureTextEntry={secureTextEntry && !showPassword}
              editable={!readOnly && props.editable !== false}
              placeholder={focused ? props.placeholder : ''}
              onFocus={(e) => {
                setFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                onBlur?.(e);
              }}
              placeholderTextColor="#94A3B8"
              style={{
                flex: 1,
                paddingTop: props.multiline ? 24 : 18,
                paddingBottom: 6,
                fontSize: 14,
                color: colors.text,
                fontFamily: fonts.inter,
                minHeight: 40,
                textAlignVertical: props.multiline ? 'top' : 'auto',
              }}
            />
            {secureTextEntry && (
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                style={{ padding: spacing.xs, justifyContent: 'center', alignItems: 'center', marginTop: 6 }}
              >
                {showPassword ? (
                  <Eye size={20} color={colors.mutedText} />
                ) : (
                  <EyeOff size={20} color={colors.mutedText} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {!!error && (
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.inter,
            color: colors.danger,
            marginTop: 4,
            marginLeft: spacing.md,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
