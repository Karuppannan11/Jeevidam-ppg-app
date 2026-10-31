// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  IconButton,
  Searchbar,
  ActivityIndicator,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ApiService from '../api/api';

const DashboardScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalPPG: 0,
    totalFPO: 0,
    totalMembers: 0,
    activeMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await ApiService.getDashboardStats();
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
  };

  const modules = [
    {
      id: 1,
      title: 'PPG Members',
      icon: 'account-group',
      color: '#4CAF50',
      screen: 'PPGMemberDetails',
    },
    {
      id: 2,
      title: 'PPG Details',
      icon: 'information-outline',
      color: '#2196F3',
      screen: 'PPGDetails',
    },
    {
      id: 3,
      title: 'FPO Members',
      icon: 'account-multiple',
      color: '#FF9800',
      screen: 'FPOMemberDetails',
    },
    {
      id: 4,
      title: 'FPO Details',
      icon: 'domain',
      color: '#9C27B0',
      screen: 'FPODetails',
    },
  ];

  const statItems = [
    { label: 'Total PPG', value: stats.totalPPG || 0, icon: 'account-group', color: '#4CAF50' },
    { label: 'Total FPO', value: stats.totalFPO || 0, icon: 'domain', color: '#FF9800' },
    { label: 'Members', value: stats.totalMembers || 0, icon: 'account-multiple', color: '#2196F3' },
    { label: 'Active', value: stats.activeMembers || 0, icon: 'check-circle', color: '#4CAF50' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1B5E20', '#2E7D32', '#388E3C']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.subGreeting}>PPG & FPO Management</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('PPGMemberForm')}>
            <IconButton
              icon="plus-circle"
              iconColor="#fff"
              size={30}
              style={styles.addButton}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search PPG, FPO, Members..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            iconColor="#2E7D32"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          {statItems.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Card.Content style={styles.statContent}>
                <Icon name={stat.icon} size={24} color={stat.color} />
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        <View style={styles.modulesGrid}>
          {modules.map((module) => (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              onPress={() => {
                navigation.navigate(module.screen);
              }}
            >
              <LinearGradient
                colors={[module.color, module.color + 'CC']}
                style={styles.moduleGradient}
              >
                <Icon name={module.icon} size={40} color="#fff" />
                <Text style={styles.moduleTitle}>{module.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#2E7D32',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical:30,
    paddingHorizontal: 20
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    margin: 0,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  searchBar: {
    borderRadius: 12,
    elevation: 4,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 3,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  moduleCard: {
    width: '48%',
    height: 120,
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
  },
  moduleGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default DashboardScreen;