// App.js - Professional Production Version with Back to Home

import React, { useEffect, useRef } from 'react';
import { 
  NavigationContainer, 
  useNavigationContainerRef 
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Provider as PaperProvider, MD3LightTheme, DefaultTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';

// ─── Screens ────────────────────────────────────────────────────
// Existing Screens
import DashboardScreen from './src/screens/DashboardScreen';
import FPOMemberDetails from './src/screens/FPOMemberDetails';
import PPGDetails from './src/screens/PPGDetails';
import FPODetails from './src/screens/FPODetails';
import AddPPGMember from './src/screens/AddPPGMember';
import AddFPOMember from './src/screens/AddFPOMember';

// New Screens
import PPGOriginal from './src/screens/PPGOriginal';
import PPGMemberScreen from './src/screens/PPGMemberScreen';
import FPOOriginal from './src/screens/FPOOriginal';
import FPOMemberScreen from './src/screens/FPOMemberScreen';
import PPGMeetingScreen from './src/screens/PPGMeetingScreen';
import FPODemandScreen from './src/screens/FPODemandScreen';

// ── NEW: Product Management (4th PPG module) ──────────────────
import ProductManagementScreen from './src/screens/ProductManagementScreen';

const Stack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

// ─── Custom Theme ──────────────────────────────────────────────
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2E7D32',
    primaryContainer: '#E8F5E9',
    secondary: '#1565C0',
    secondaryContainer: '#E3F2FD',
    accent: '#F9A825',
    background: '#F7F5EF',
    surface: '#FFFFFF',
    error: '#D32F2F',
    success: '#2E7D32',
    warning: '#F57C00',
    info: '#1976D2',
  },
  roundness: 12,
};

// ─── Helpers ───────────────────────────────────────────────────
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return { text: 'Working late', icon: 'moon-outline' };
  if (hour < 12) return { text: 'Good morning', icon: 'sunny-outline' };
  if (hour < 17) return { text: 'Good afternoon', icon: 'partly-sunny-outline' };
  if (hour < 20) return { text: 'Good evening', icon: 'cloudy-night-outline' };
  return { text: 'Good night', icon: 'moon-outline' };
};

const getDateLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
};

// ─── Animated Module Card ──────────────────────────────────────
const ModuleCard = ({ item, index, onPress }) => {
  const entrance = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      delay: index * 90,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.95,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      speed: 30,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: entrance,
        transform: [
          {
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [22, 0],
            }),
          },
          { scale: pressScale },
        ],
        width: (width - 52) / 2,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.moduleCard}
      >
        <LinearGradient
          colors={item.gradient}
          style={styles.moduleGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative corner glow */}
          <View style={styles.moduleGlow} pointerEvents="none" />

          <View style={styles.moduleIconContainer}>
            <Ionicons name={item.icon} size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.moduleLabel} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.moduleDescription} numberOfLines={2}>{item.description}</Text>

          <View style={styles.moduleArrow}>
            <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Section Divider (signature element) ──────────────────────
const SectionDivider = ({ color }) => (
  <View style={styles.dividerRow}>
    <View style={[styles.dividerLine, { backgroundColor: color + '33' }]} />
    <View style={[styles.dividerDot, { backgroundColor: color }]} />
    <View style={[styles.dividerLine, { backgroundColor: color + '33' }]} />
  </View>
);

// ─── Home Screen ───────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const greeting = getGreeting();
  const bannerFade = useRef(new Animated.Value(0)).current;
  const bannerSlide = useRef(new Animated.Value(-16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bannerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(bannerSlide, { toValue: 0, speed: 10, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const sections = [
    {
      id: 'ppg',
      title: 'PPG Management',
      icon: 'leaf',
      color: '#2E7D32',
      items: [
        {
          id: 'ppg-registration',
          label: 'PPG Registration',
          icon: 'people-outline',
          screen: 'PPGMemberScreen',
          description: 'Register a new PPG',
      gradient: ['#b95216', '#9b3202'],
        },
        {
          id: 'ppg-members',
          label: 'PPG Info',
          icon: 'clipboard-outline',
          screen: 'PPGOriginal',
          description: 'View account details',
      gradient: ['#b95216', '#9b3202'],
        },
            {
          id: 'ppg-products',
          label: 'Products',
          icon: 'pricetags-outline',
          screen: 'ProductManagement',
          description: 'Manage products',
          gradient: ['#FB8C00', '#EF6C00'],
        },
        {
          id: 'ppg-meeting',
          label: 'PPG Meeting',
          icon: 'calendar-outline',
          screen: 'PPGMeeting',
          description: 'Record a meeting',
          gradient: ['#F9A825', '#F57F17'],
        },
    
      ],
    },
    // {
    //   id: 'fpo',
    //   title: 'FPO Management',
    //   icon: 'business',
    //   color: '#1565C0',
    //   items: [
    //     {
    //       id: 'fpo-registration',
    //       label: 'FPO Registration',
    //       icon: 'document-text-outline',
    //       screen: 'FPOOriginal',
    //       description: 'Register a new FPO',
    //       gradient: ['#1565C0', '#0D47A1'],
    //     },
    //     {
    //       id: 'fpo-members',
    //       label: 'FPO Members',
    //       icon: 'people-circle-outline',
    //       screen: 'FPOMemberScreen',
    //       description: 'Manage members',
    //       gradient: ['#1976D2', '#1565C0'],
    //     },
    //     {
    //       id: 'fpo-demand',
    //       label: 'FPO Demand',
    //       icon: 'cart-outline',
    //       screen: 'FPODemand',
    //       description: 'Record demand',
    //       gradient: ['#0288D1', '#01579B'],
    //     },
    //   ],
    // },
  ];

  return (
    <ScrollView
      style={styles.homeContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.homeContent}
    >
      {/* Header Banner */}
      <Animated.View
        style={{ opacity: bannerFade, transform: [{ translateY: bannerSlide }] }}
      >
        <LinearGradient
          colors={['#1B5E20', '#2E7D32', '#43A047']}
          style={styles.banner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Decorative blobs for depth */}
          <View style={styles.blobLarge} pointerEvents="none" />
          <View style={styles.blobSmall} pointerEvents="none" />

          <View style={styles.bannerTopRow}>
            <View style={styles.greetingPill}>
              <Ionicons name={greeting.icon} size={14} color="#FFF7E0" />
              <Text style={styles.greetingPillText}>{greeting.text}</Text>
            </View>
            <Text style={styles.dateText}>{getDateLabel()}</Text>
          </View>

          <View style={styles.bannerContent}>
            <View style={styles.bannerIconContainer}>
              <FontAwesome5 name="seedling" size={30} color="#FFFFFF" />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>PPG & FPO</Text>
              <Text style={styles.bannerSubtitle}>Management System</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Modules */}
      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIconBadge, { backgroundColor: section.color + '1A' }]}>
                <Ionicons name={section.icon} size={18} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: '#263238' }]}>
                {section.title}
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: section.color + '14' }]}>
              <Text style={[styles.countBadgeText, { color: section.color }]}>
                {section.items.length} modules
              </Text>
            </View>
          </View>

          <SectionDivider color={section.color} />

          <View style={styles.moduleGrid}>
            {section.items.map((item, idx) => (
              <ModuleCard
                key={item.id}
                item={item}
                index={idx}
                onPress={(it) => navigation.navigate(it.screen)}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// ─── Main Tabs ─────────────────────────────────────────────────
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarIndicatorStyle: styles.tabIndicator,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarScrollEnabled: true,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen 
        name="PPG Details" 
        component={PPGDetails}
        options={{ tabBarIcon: ({ color }) => (
          <Ionicons name="document-text" size={20} color={color} />
        )}}
      />
      <Tab.Screen 
        name="FPO Members" 
        component={FPOMemberDetails}
        options={{ tabBarIcon: ({ color }) => (
          <Ionicons name="business" size={20} color={color} />
        )}}
      />
      <Tab.Screen 
        name="FPO Details" 
        component={FPODetails}
        options={{ tabBarIcon: ({ color }) => (
          <Ionicons name="stats-chart" size={20} color={color} />
        )}}
      />
    </Tab.Navigator>
  );
};

// ─── Custom Header Back Button ────────────────────────────────
const CustomHeaderBack = ({ navigation }) => (
  <TouchableOpacity 
    onPress={() => navigation.navigate('Home')} 
    style={styles.headerBackButton}
  >
    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
  </TouchableOpacity>
);

// ─── Screen Options ────────────────────────────────────────────
const screenOptions = ({ navigation }) => ({
  headerStyle: {
    backgroundColor: '#2E7D32',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
  },
  headerBackTitleVisible: false,
  headerTitleAlign: 'center',
  headerShadowVisible: false,
  headerLeft: () => <CustomHeaderBack navigation={navigation} />,
});

// ─── App Component ─────────────────────────────────────────────
export default function App() {
  const navigationRef = useNavigationContainerRef();

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style="light" backgroundColor="#1B5E20" />
        <NavigationContainer ref={navigationRef} theme={theme}>
          <Stack.Navigator 
            screenOptions={screenOptions}
            initialRouteName="Home"
          >
            {/* Home */}
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ 
                headerShown: false,
              }}
            />

            {/* PPG Screens */}
            <Stack.Screen 
              name="PPGOriginal" 
              component={PPGOriginal} 
              options={{ 
                title: 'PPG Account info',
              }} 
            /> 
            
            <Stack.Screen 
              name="PPGMemberScreen" 
              component={PPGMemberScreen} 
              options={{ 
                title: 'PPG Registration',
              }} 
            />

            <Stack.Screen 
              name="PPGMeeting" 
              component={PPGMeetingScreen} 
              options={{ 
                title: 'PPG Meeting',
              }} 
            /> 

            {/* NEW: 4th PPG module — Product Management */}
            <Stack.Screen 
              name="ProductManagement" 
              component={ProductManagementScreen} 
              options={{ 
                title: 'Products & Units',
              }} 
            />

            {/* FPO Screens */}
            <Stack.Screen 
              name="FPOOriginal" 
              component={FPOOriginal} 
              options={{ 
                title: 'FPO Registration',
              }} 
            />
            
            <Stack.Screen 
              name="FPOMemberScreen" 
              component={FPOMemberScreen} 
              options={{ 
                title: 'FPO Members',
              }} 
            />

            <Stack.Screen 
              name="FPODemand" 
              component={FPODemandScreen} 
              options={{ 
                title: 'FPO Demand',
              }} 
            />

            {/* Legacy Screens */}
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
              options={{ headerShown: false }} 
            />
            
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabs} 
              options={{ 
                title: 'PPG & FPO Management',
              }} 
            />
           
            <Stack.Screen 
              name="FPOMemberDetails" 
              component={FPOMemberDetails} 
              options={{ title: 'FPO Members' }} 
            />
            
            <Stack.Screen 
              name="PPGDetails" 
              component={PPGDetails} 
              options={{ title: 'PPG Details' }} 
            />
            
            <Stack.Screen 
              name="FPODetails" 
              component={FPODetails} 
              options={{ title: 'FPO Details' }} 
            />
            
            <Stack.Screen 
              name="AddPPGMember" 
              component={AddPPGMember} 
              options={{ 
                title: 'Add PPG Member',
                presentation: 'modal',
              }} 
            />
            
            <Stack.Screen 
              name="AddFPOMember" 
              component={AddFPOMember} 
              options={{ 
                title: 'Add FPO Member',
                presentation: 'modal',
              }} 
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Home Screen
  homeContainer: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },
  homeContent: {
    paddingBottom: 40,
  },

  // Banner
  banner: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  blobLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -40,
  },
  blobSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(249,168,37,0.15)',
    bottom: -20,
    left: -20,
  },
  bannerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  greetingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  greetingPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF7E0',
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 29,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
    fontWeight: '500',
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Divider (signature element)
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1.5,
    borderRadius: 1,
  },
  dividerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Module Cards
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  moduleGradient: {
    padding: 16,
    minHeight: 128,
    justifyContent: 'center',
  },
  moduleGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -20,
    right: -20,
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  moduleLabel: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moduleDescription: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 3,
    lineHeight: 15,
  },
  moduleArrow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tab Bar
  tabBar: {
    backgroundColor: '#FFFFFF',
    elevation: 0,
    shadowOpacity: 0,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF0',
    height: 55,
  },
  tabIndicator: {
    backgroundColor: '#2E7D32',
    height: 3,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tabItem: {
    paddingHorizontal: 8,
  },

  // Header
  headerBackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 4,
  },
  headerRightButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});