// MemberDemandsDisplay.js - Component to show complete member demands

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const MemberDemandsDisplay = ({ memberDemands }) => {
  if (!memberDemands || memberDemands.length === 0) {
    return <Text style={styles.noData}>No demands found</Text>;
  }

  // Group demands by member
  const groupedDemands = {};
  memberDemands.forEach(demand => {
    const key = demand.member_id || demand.member_name;
    if (!groupedDemands[key]) {
      groupedDemands[key] = {
        member_id: demand.member_id,
        member_name: demand.member_name,
        member_unique_id: demand.member_unique_id,
        demands: []
      };
    }
    groupedDemands[key].demands.push(demand);
  });

  const renderMemberDemands = ({ item }) => {
    const memberTotal = item.demands.reduce((sum, d) => sum + parseFloat(d.total || 0), 0);
    
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <Text style={styles.memberName}>{item.member_name}</Text>
          <Text style={styles.memberId}>ID: {item.member_id}</Text>
        </View>
        
        <View style={styles.demandsContainer}>
          {item.demands.map((demand, index) => (
            <View key={index} style={styles.demandItem}>
              <Text style={styles.productName}>{demand.product_name || 'Unknown Product'}</Text>
              <View style={styles.demandDetails}>
                <Text style={styles.demandText}>Qty: {demand.quantity || 0}</Text>
                <Text style={styles.demandText}>Price: ₹{demand.unit_price || 0}</Text>
                <Text style={styles.demandTotal}>Total: ₹{demand.total || 0}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <View style={styles.memberTotal}>
          <Text style={styles.totalText}>Member Total: ₹{memberTotal.toFixed(2)}</Text>
          <Text style={styles.demandCount}>{item.demands.length} demand(s)</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={Object.values(groupedDemands)}
      keyExtractor={(item) => item.member_id || item.member_name}
      renderItem={renderMemberDemands}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  memberId: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  demandsContainer: {
    marginVertical: 4,
  },
  demandItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  demandDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  demandText: {
    fontSize: 13,
    color: '#34495e',
  },
  demandTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
  },
  memberTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
  },
  demandCount: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  noData: {
    textAlign: 'center',
    color: '#95a5a6',
    fontSize: 14,
    padding: 20,
  },
});

export default MemberDemandsDisplay;