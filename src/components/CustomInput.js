import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../config/theme';

export default function CustomInput({ label, placeholder, value, onChangeText, secureTextEntry, icon, leftIcon, error, variant, ...rest }) {
  const isUnderlined = variant === 'underlined';
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[
        styles.inputContainer,
        isUnderlined && styles.underlinedContainer,
        error && styles.inputContainerError,
        error && isUnderlined && styles.underlinedContainerError
      ]}>
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          style={[styles.input, isUnderlined && styles.underlinedInput]}
          placeholderTextColor={COLORS.muted}
          {...rest}
        />
        {icon ? <View style={styles.icon}>{icon}</View> : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { color: COLORS.muted, fontSize: 13, marginBottom: 4, fontFamily: FONTS.inter },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  underlinedContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 0,
    paddingHorizontal: 0,
    minHeight: 40,
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  underlinedContainerError: {
    borderBottomColor: '#EF4444',
  },
  leftIcon: { marginRight: 8, justifyContent: 'center', alignItems: 'center' },
  icon: { marginLeft: 8 },
  input: { flex: 1, color: COLORS.secondary, fontSize: 15, fontFamily: FONTS.inter },
  underlinedInput: { paddingVertical: 6 },
  errorText: { color: '#EF4444', fontSize: 11, marginTop: 4, fontFamily: FONTS.inter },
});
