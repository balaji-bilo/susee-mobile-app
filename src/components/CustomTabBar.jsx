import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, History, User, ClipboardList, ShieldCheck, Wrench } from 'lucide-react-native';
import { COLORS, FONTS } from '../config/theme';

const TAB_BAR_HEIGHT = 72;

const getIcon = (routeName, color, size = 22) => {
  switch (routeName) {
    case 'Home':
    case 'GateHome':
      return <Home color={color} size={size} />;
    case 'History':
      return <History color={color} size={size} />;
    case 'JobDashboard':
    case 'Dashboard':
      return <Wrench color={color} size={size} />;
    case 'Record':
      return <ClipboardList color={color} size={size} />;
    case 'Profile':
      return <User color={color} size={size} />;
    default:
      return <ShieldCheck color={color} size={size} />;
  }
};

function TabItem({ routeName, isFocused, onPress, onLongPress, label }) {
  const activeAnim = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeAnim, {
      toValue: isFocused ? 1 : 0,
      useNativeDriver: true,
      tension: 30,
      friction: 7,
    }).start();
  }, [isFocused, activeAnim]);

  const translateY = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -7],
  });

  const scale = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const labelOpacity = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const labelTranslateY = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  const activeOpacity = activeAnim;
  const inactiveOpacity = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        {/* Active Icon (primary color) */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              opacity: activeOpacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {getIcon(routeName, '#FFFFFF')}
        </Animated.View>

        {/* Inactive Icon (gray) */}
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              position: 'absolute',
              opacity: inactiveOpacity,
              transform: [{ translateY }, { scale }],
            },
          ]}
        >
          {getIcon(routeName, '#64748B')}
        </Animated.View>
      </View>
      <Animated.Text
        style={[
          styles.label,
          {
            opacity: labelOpacity,
            transform: [{ translateY: labelTranslateY }],
          },
        ]}
      >
        {label}
      </Animated.Text>
    </TouchableOpacity>
  );
}

export function CustomTabBar({ state, descriptors, navigation }) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;
  const totalTabs = state.routes.length;
  const tabWidth = screenWidth / totalTabs;

  // Initialize the horizontal translation animation value
  const slideAnim = useRef(
    new Animated.Value((state.index + 0.5) * tabWidth)
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: (state.index + 0.5) * tabWidth,
      useNativeDriver: true,
      tension: 30,
      friction: 7,
    }).start();
  }, [state.index, tabWidth, slideAnim]);

  // Construct SVG paths based on dimensions
  // y = 15 is the flat top line of the tab bar
  // The cutout curve starts at x = screenWidth - 45 and ends at x = screenWidth + 45
  const svgPath = `M 0 15 L ${screenWidth - 54} 15 C ${screenWidth - 36} 15, ${screenWidth - 36} 62, ${screenWidth} 62 C ${screenWidth + 36} 62, ${screenWidth + 36} 15, ${screenWidth + 54} 15 L ${3 * screenWidth} 15 L ${3 * screenWidth} ${totalHeight} L 0 ${totalHeight} Z`;
  const borderPath = `M 0 15 L ${screenWidth - 54} 15 C ${screenWidth - 36} 15, ${screenWidth - 36} 62, ${screenWidth} 62 C ${screenWidth + 36} 62, ${screenWidth + 36} 15, ${screenWidth + 54} 15 L ${3 * screenWidth} 15`;

  return (
    <View style={[styles.container, { height: totalHeight, paddingBottom: insets.bottom }]}>
      {/* Background SVG Curve */}
      <Animated.View
        style={[
          styles.backgroundContainer,
          {
            width: 3 * screenWidth,
            height: totalHeight,
            left: -screenWidth,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <Svg width={3 * screenWidth} height={totalHeight}>
          {/* Main filled tab bar background */}
          <Path d={svgPath} fill={COLORS.card} />
          {/* Top border of the tab bar */}
          <Path d={borderPath} fill="none" stroke={COLORS.primary} strokeWidth={2} />
        </Svg>
      </Animated.View>

      {/* Floating Active White Circle Badge */}
      <Animated.View
        style={[
          styles.activeCircle,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.circleInner} />
      </Animated.View>

      {/* Interactive Tab Buttons */}
      <View style={[styles.buttonsContainer, { height: TAB_BAR_HEIGHT }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              label={label}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'transparent',
  },
  activeCircle: {
    position: 'absolute',
    top: 3, // Centers circle vertically with peak height (rises to y = 3, center y = 30)
    left: -27, // Centers circle horizontally on the selected tab coordinate
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for the entire badge
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  circleInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 25, // Centers icon vertically at y = 37 (since icon height is 24, center is 37)
    height: 24,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    position: 'absolute',
    top: 53,
    left: 0,
    right: 0,
    fontSize: 11,
    fontFamily: FONTS.inter,
    color: '#64748B',
    textAlign: 'center',
  },
});
