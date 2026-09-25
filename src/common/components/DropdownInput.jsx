import React, { useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ChevronDown, Check, X, Fuel, Zap, Leaf, Flame } from 'lucide-react-native';
import { colors, fonts, radius, spacing } from '../styles/theme';

const getOptionMeta = (val, defaultIcon = Fuel) => {
  if (val === undefined || val === null) {
    return {
      icon: defaultIcon,
      iconColor: colors.mutedText,
      bgColor: colors.background,
    };
  }
  const normalized = String(val).toLowerCase();
  switch (normalized) {
    case 'petrol':
      return {
        icon: Fuel,
        iconColor: '#0284c7',
        bgColor: '#e0f2fe',
      };
    case 'diesel':
      return {
        icon: Fuel,
        iconColor: '#d97706',
        bgColor: '#fef3c7',
      };
    case 'cng':
      return {
        icon: Flame,
        iconColor: '#059669',
        bgColor: '#dcfce7',
      };
    case 'ev':
      return {
        icon: Zap,
        iconColor: '#7c3aed',
        bgColor: '#f3e8ff',
      };
    case 'hybrid':
      return {
        icon: Leaf,
        iconColor: '#0d9488',
        bgColor: '#ccfbf1',
      };
    default:
      return {
        icon: defaultIcon,
        iconColor: colors.mutedText,
        bgColor: colors.background,
      };
  }
};

export function DropdownInput({ label, value, options, onSelect, containerStyle, error, required, icon }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => {
    if (!opt) return false;
    if (typeof opt === 'string') {
      return opt.toLowerCase() === String(value ?? '').toLowerCase();
    }
    return String(opt.value).toLowerCase() === String(value ?? '').toLowerCase() ||
           String(opt.label).toLowerCase() === String(value ?? '').toLowerCase();
  });

  const displayValue = selectedOption 
    ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label) 
    : '';

  const borderColor = error ? colors.danger : isOpen ? colors.primary : colors.border;

  const handleSelect = (item) => {
    const val = typeof item === 'string' ? item : item.value;
    onSelect(val);
    setIsOpen(false);
  };

  return (
    <View style={{ marginBottom: spacing.xs }}>
      <TouchableOpacity 
        onPress={() => setIsOpen(true)} 
        activeOpacity={0.9}
        style={[
          {
            minHeight: 58,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            justifyContent: 'center',
          },
          containerStyle,
        ]}
      >
        <View 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                color: value ? colors.text : colors.mutedText,
                fontFamily: fonts.inter,
              }}
            >
              {displayValue || `Select ${label}`}
            </Text>
            {!value && required && (
              <Text
                style={{
                  fontFamily: fonts.inter,
                  fontSize: 14,
                  color: colors.danger,
                  marginLeft: 2,
                  marginTop: -2,
                }}
              >
                *
              </Text>
            )}
          </View>
          <ChevronDown size={20} color={isOpen ? colors.primary : colors.mutedText} style={{ marginLeft: spacing.xs }} />
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

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            justifyContent: 'flex-end',
          }}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: spacing.xxxl,
              maxHeight: '75%',
              shadowColor: colors.shadowHeavy,
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 15,
            }}
          >
            <View 
              style={{
                width: 42,
                height: 5,
                borderRadius: radius.pill,
                backgroundColor: colors.border,
                alignSelf: 'center',
                marginTop: spacing.md,
                marginBottom: spacing.xs,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: fonts.inter,
                  fontWeight: '700',
                  color: colors.text,
                }}
              >
                Select {label}
              </Text>
              <TouchableOpacity 
                onPress={() => setIsOpen(false)}
                style={{
                  padding: spacing.xs,
                  borderRadius: radius.pill,
                  backgroundColor: colors.background,
                }}
              >
                <X size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              contentContainerStyle={{ 
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg 
              }}
            >
              {options.map((option, idx) => {
                const optVal = typeof option === 'string' ? option : option.value;
                const optLabel = typeof option === 'string' ? option : option.label;
                const isSelected = String(value ?? '').toLowerCase() === String(optVal ?? '').toLowerCase();
                const meta = getOptionMeta(optVal, icon);
                const OptionIcon = meta.icon;

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm + 2,
                      marginVertical: spacing.xs,
                      borderRadius: radius.md,
                      borderWidth: 1.5,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected ? colors.primarySoft : colors.surface,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: radius.sm,
                          backgroundColor: meta.bgColor,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: spacing.md,
                        }}
                      >
                        <OptionIcon size={20} color={meta.iconColor} />
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: fonts.inter,
                          fontWeight: isSelected ? '600' : '500',
                          color: colors.text,
                        }}
                      >
                        {optLabel}
                      </Text>
                    </View>
                    {isSelected ? (
                      <View 
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: colors.primary,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Check size={14} color="#ffffff" />
                      </View>
                    ) : (
                      <View 
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 1.5,
                          borderColor: colors.border,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
