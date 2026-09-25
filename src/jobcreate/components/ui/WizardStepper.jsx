import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { colors, fonts, spacing } from '../../../common/config/theme';
import { Car, User, Wrench, Camera, ClipboardCheck } from 'lucide-react-native';

const STEP_CONFIG = [
  { label: 'Vehicle', Icon: Car },
  { label: 'Owner', Icon: User },
  { label: 'Services', Icon: Wrench },
  { label: 'Billing', Icon: ClipboardCheck },
  { label: 'Photos', Icon: Camera },
];

export function WizardStepper({ steps, activeStep }) {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 480;

  const numSteps = steps.length;
  const nodeHalfWidthPercent = 100 / (numSteps * 2);
  const activeLineWidthPercent = (activeStep / (numSteps - 1)) * (100 - 100 / numSteps);

  return (
    <View style={{ marginBottom: spacing.md, paddingVertical: spacing.sm }}>
      {/* Stepper Timeline Container */}
      <View style={{ position: 'relative', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>

        {/* Progress Line Track Background */}
        <View
          style={{
            position: 'absolute',
            left: `${nodeHalfWidthPercent}%`,
            right: `${nodeHalfWidthPercent}%`,
            top: 22, // Vertically centered relative to the 44px badge height
            height: 2,
            backgroundColor: colors.border,
            zIndex: 1,
          }}
        />

        {/* Highlighted Active Progress Line Track */}
        <View
          style={{
            position: 'absolute',
            left: `${nodeHalfWidthPercent}%`,
            width: `${activeLineWidthPercent}%`,
            top: 22,
            height: 2,
            backgroundColor: '#0D9488', // Teal accent line to show progress
            zIndex: 2,
          }}
        />

        {steps.map((step, index) => {
          const active = index === activeStep;
          const completed = index < activeStep;
          const config = STEP_CONFIG[index] || { label: step, Icon: Wrench };
          const StepIcon = config.Icon;

          // Styling variables
          const badgeBgColor = active
            ? colors.primary // Blue for active step
            : completed
              ? '#0D9488' // Teal for completed steps
              : '#F8FAFC'; // Light gray for future/inactive steps

          const badgeBorderColor = active
            ? colors.primary
            : completed
              ? '#0D9488'
              : '#E2E8F0';

          const iconColor = active || completed ? '#FFFFFF' : '#94A3B8';

          return (
            <View
              key={step}
              style={{
                alignItems: 'center',
                flex: 1,
                zIndex: 3,
              }}
            >
              {/* Step Badge (44x44 Rounded Square matching design) */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: badgeBorderColor,
                  backgroundColor: badgeBgColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: active ? colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.12,
                  shadowRadius: 5,
                  elevation: active ? 3 : 0,
                }}
              >
                <StepIcon size={18} color={iconColor} strokeWidth={2.2} />
              </View>

              {/* Labels below the badge */}
              <View style={{ alignItems: 'center', marginTop: 8, paddingHorizontal: 2 }}>
                <Text
                  style={{
                    fontFamily: fonts.inter,
                    fontSize: 10,
                    color: active ? '#0F5C96' : completed ? '#0D9488' : '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Step {index + 1}
                </Text>

                {(!isSmallScreen || active) && (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.inter,
                      color: active ? '#1E293B' : '#64748B',
                      fontSize: 11,
                      marginTop: 1,
                      textAlign: 'center',
                    }}
                  >
                    {config.label}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
