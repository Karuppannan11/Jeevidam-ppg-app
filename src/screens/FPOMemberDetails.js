// src/screens/FPOMemberDetails.js
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {
  Card,
  Text,
  Searchbar,
  FAB,
  Chip,
  IconButton,
  Avatar,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FPOMemberDetails = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fpoMembers = [
    {
      id: 1,
      name: 'Green Valley FPO',
      code: 'FPO001',
      members: 45,
      status: 'Active',
      location: 'Pune, Maharashtra',
      type: 'Producer Organization',
    },
    {
      id: 2,
      name: 'Sunrise Farmers FPO',
      code: 'FPO002',
      members: 32,
      status: 'Active',
      location: 'Nashik, Maharashtra',
      type: 'Marketing Organization',
    },
  ];

  const renderFPOCard = ({ item }) => (
    <Card style={styles.fpoCard}>
      <TouchableOpacity>
        <Card.Content>
          <View style={styles.fpoHeader}>
            <View style={styles.fpoInfo}>
              <Avatar.Icon size={50} icon="domain" style={styles.avatarIcon} />
              <View style={styles.fpoDetails}>
                <Text style={styles.fpoName}>{item.name}</Text>
                <Text style={styles.fpoCode}>{item.code}</Text>
                <View style={styles.fpoMeta}>
                  <Chip
                    icon="account-group"
                    style={styles.metaChip}
                    textStyle={styles.metaChipText}
                  >
                    {item.members} members
                  </Chip>
                  <Chip
                    icon={item.status === 'Active' ? 'check-circle' : 'close-circle'}
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          item.status === 'Active' ? '#E8F5E9' : '#FFEBEE',
                      },
                    ]}
                    textStyle={{
                      fontSize: 10,
                      color: item.status === 'Active' ? '#2E7D32' : '#C62828',
                    }}
                  >
                    {item.status}
                  </Chip>
                </View>
              </View>
            </View>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E65100', '#F57C00']} style={styles.header}>
        <Text style={styles.headerTitle}>FPO Members</Text>
        <Text style={styles.headerSubtitle}>Manage FPO organizations</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Searchbar
          placeholder="Search FPOs..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#E65100"
        />

        <FlatList
          data={fpoMembers}
          renderItem={renderFPOCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddFPOMember')}
        color="#fff"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    marginTop: 10,
  },
  searchBar: {
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 2,
    marginBottom: 15,
  },
  listContainer: {
    paddingBottom: 80,
  },
  fpoCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  fpoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fpoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarIcon: {
    backgroundColor: '#FFF3E0',
  },
  fpoDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fpoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fpoCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  fpoMeta: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  metaChip: {
    height: 22,
    backgroundColor: '#E3F2FD',
  },
  metaChipText: {
    fontSize: 10,
    color: '#1976D2',
  },
  statusChip: {
    height: 22,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#E65100',
  },
});

export default FPOMemberDetails;