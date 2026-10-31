// src/navigation/MainTabs.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet } from 'react-native';

// Import Screens
import PPGMemberDetails from '../screens/PPGMemberDetails';
import FPOMemberDetails from '../screens/FPOMemberDetails';
import PPGDetails from '../screens/PPGDetails';
import FPODetails from '../screens/FPODetails';

const Tab = createMaterialTopTabNavigator();

// Placeholder for Demand & Supply
const DemandSupplyScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Demand & Supply</Text>
    <Text style={styles.subtitle}>Coming soon...</Text>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#2E7D32',
          elevation: 0,
          shadowOpacity: 0,
          height: 55,
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#FFFFFF',
          height: 3,
          borderRadius: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
      }}
    >
      <Tab.Screen name="PPG Members" component={PPGMemberDetails} />
      <Tab.Screen name="PPG Details" component={PPGDetails} />
      <Tab.Screen name="FPO Members" component={FPOMemberDetails} />
      <Tab.Screen name="FPO Details" component={FPODetails} />
      <Tab.Screen name="Demand & Supply" component={DemandSupplyScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});

export default MainTabs;