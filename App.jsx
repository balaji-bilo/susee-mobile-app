/**
 * Main application entry point with Role-Based Dynamic Tab Navigation & Dual Platform Login Support.
 */
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Common Views (Unified Login & Splash)
import { SplashScreen } from './src/common/views/SplashScreen.jsx';
import { LoginScreen } from './src/common/views/LoginScreen.jsx';
import { ProfileScreen } from './src/common/views/ProfileScreen.jsx';

// Gate Security Views
import HomeScreen from './src/gatesecurity/views/HomeScreen.jsx';
import HistoryScreen from './src/gatesecurity/views/HistoryScreen.jsx';
import HistoryDetailScreen from './src/gatesecurity/views/HistoryDetailScreen.jsx';

// Job Card Creation Views
import { DashboardScreen } from './src/jobcreate/views/DashboardScreen.jsx';
import { JobCardWizard } from './src/jobcreate/views/JobCardWizard.jsx';
import { RecordScreen } from './src/jobcreate/views/RecordScreen.jsx';
import { RecordDetailScreen } from './src/jobcreate/views/RecordDetailScreen.jsx';
import { NotificationScreen } from './src/jobcreate/views/NotificationScreen.jsx';

// Floor Supervisor Views
import { AssignMechanicScreen } from './src/floorsupervisor/views/AssignMechanicScreen.jsx';
import { AdditionalWorkScreen } from './src/floorsupervisor/views/AdditionalWorkScreen.jsx';
import { FloorJobCardsScreen } from './src/floorsupervisor/views/FloorJobCardsScreen.jsx';
import { FloorJobCardViewScreen } from './src/floorsupervisor/views/FloorJobCardViewScreen.jsx';
import { EditSelectedServicesScreen } from './src/floorsupervisor/views/EditSelectedServicesScreen.jsx';
import { AddAdditionalWorkScreen } from './src/floorsupervisor/views/AddAdditionalWorkScreen.jsx';

// Shared Storage & Tab Bar
import { retrieveEncryptedData } from './src/common/config/storage.js';
import { CustomTabBar } from './src/common/components/CustomTabBar.jsx';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ route }) {
  const [userRole, setUserRole] = useState(route.params?.role || '');
  const [appModule, setAppModule] = useState(route.params?.appModule || '');

  useEffect(() => {
    const loadRoleAndModule = async () => {
      try {
        const storedRole = await retrieveEncryptedData('roleName');
        const storedModule = await retrieveEncryptedData('appModule');
        if (storedRole) setUserRole(storedRole);
        if (storedModule) setAppModule(storedModule);

        if (!storedRole) {
          const userJson = await retrieveEncryptedData('user');
          if (userJson) {
            const userObj = JSON.parse(userJson);
            const rName = userObj.role?.name || userObj.role || userObj.roleName || userObj.type || '';
            if (rName) setUserRole(rName);
          }
        }
      } catch (err) {
        console.error('Error loading user role/module in MainTabs:', err);
      }
    };
    loadRoleAndModule();
  }, [route.params?.role, route.params?.appModule]);

  const upperRole = String(userRole || '').toUpperCase();
  const upperModule = String(appModule || '').toUpperCase();

  const isAdmin = upperRole.includes('ADMIN') || upperRole.includes('SUPERADMIN') || upperRole === 'SUPER';
  const isFloorRole = upperModule === 'FLOOR_SUPERVISOR' || upperRole.includes('FLOOR') || upperRole.includes('SUPERVISOR') || upperRole.includes('BODY_SHOP');
  const isGateRole = upperModule === 'GATE_SECURITY' || upperRole.includes('GATE') || upperRole.includes('SECURITY') || upperRole.includes('GUARD') || upperRole.includes('KEEPER');
  const isJobRole = upperModule === 'JOB_CREATE' || upperRole.includes('JOB') || upperRole.includes('ADVISOR') || upperRole.includes('CREATOR');

  let showGateTabs = false;
  let showJobTabs = false;
  let showFloorTabs = false;

  if (isAdmin) {
    showGateTabs = true;
    showJobTabs = true;
    showFloorTabs = true;
  } else if (isFloorRole) {
    showGateTabs = false;
    showJobTabs = false;
    showFloorTabs = true;
  } else if (isGateRole) {
    showGateTabs = true;
    showJobTabs = false;
    showFloorTabs = false;
  } else {
    showGateTabs = false;
    showJobTabs = true;
    showFloorTabs = false;
  }

  // Initial tab route based on active tabs
  let initialRoute = 'JobDashboard';
  if (showFloorTabs) {
    initialRoute = 'AssignMechanic';
  } else if (showGateTabs && !showJobTabs) {
    initialRoute = 'GateHome';
  }

  return (
    <Tab.Navigator
      key={`tab-${showFloorTabs ? 'floor' : showGateTabs ? 'gate' : 'job'}`}
      initialRouteName={initialRoute}
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {showGateTabs && (
        <Tab.Screen
          name="GateHome"
          component={HomeScreen}
          options={{ title: 'Gate Entry' }}
        />
      )}
      {showGateTabs && (
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Gate History' }}
        />
      )}
      {showJobTabs && (
        <Tab.Screen
          name="JobDashboard"
          component={DashboardScreen}
          options={{ title: 'Job Cards' }}
        />
      )}
      {showJobTabs && (
        <Tab.Screen
          name="Record"
          component={RecordScreen}
          options={{ title: 'Records' }}
        />
      )}
      {showFloorTabs && (
        <Tab.Screen
          name="AssignMechanic"
          component={AssignMechanicScreen}
          options={{ title: 'Assign' }}
        />
      )}
      {showFloorTabs && (
        <Tab.Screen
          name="AdditionalWork"
          component={AdditionalWorkScreen}
          options={{ title: 'Add Work' }}
        />
      )}
      {showFloorTabs && (
        <Tab.Screen
          name="FloorJobCards"
          component={FloorJobCardsScreen}
          options={{ title: 'Job Cards' }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="HistoryDetail" component={HistoryDetailScreen} />
          <Stack.Screen name="JobCardWizard" component={JobCardWizard} />
          <Stack.Screen name="RecordDetailScreen" component={RecordDetailScreen} />
          <Stack.Screen name="FloorJobCardViewScreen" component={FloorJobCardViewScreen} />
          <Stack.Screen name="EditSelectedServicesScreen" component={EditSelectedServicesScreen} />
          <Stack.Screen name="AddAdditionalWorkScreen" component={AddAdditionalWorkScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
