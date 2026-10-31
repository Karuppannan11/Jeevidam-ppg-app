// MeetingDetailScreen.js - Show all member demands with details

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../api/api';
import MemberDemandsDisplay from '../components/MemberDemandsDisplay';

const MeetingDetailScreen = ({ route }) => {
  const { meetingId } = route.params;
  const [meeting, setMeeting] = useState(null);
  const [memberDemands, setMemberDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeetingDetails();
  }, [meetingId]);

  const fetchMeetingDetails = async () => {
    try {
      setLoading(true);
      
      // Get meeting details
      const meetingData = await api.getMeetingDetails(meetingId);
      setMeeting(meetingData);
      
      // Get member demands with full details
      const demandsData = await api.getMemberDemands(meetingId);
      setMemberDemands(demandsData.members || []);
      
      console.log('📊 Member demands with details:', JSON.stringify(demandsData, null, 2));
    } catch (err) {
      console.error('Error fetching meeting details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading meeting details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!meeting) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.noDataText}>No meeting found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Meeting Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meeting Details</Text>
        <Text style={styles.date}>Date: {meeting.meeting_date}</Text>
        <Text style={styles.ppgName}>PPG: {meeting.ppg_name}</Text>
      </View>

      {/* Meeting Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Meeting Information</Text>
        <Text style={styles.infoText}>Venue: {meeting.venue || 'Not specified'}</Text>
        <Text style={styles.infoText}>Time: {meeting.meeting_time || 'Not specified'}</Text>
        <Text style={styles.infoText}>Discussions: {meeting.discussions || 'None'}</Text>
        <Text style={styles.infoText}>Resolutions: {meeting.major_resolutions || 'None'}</Text>
      </View>

      {/* Receipt Summary */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Receipt Summary</Text>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Cash at Bank:</Text>
          <Text style={styles.receiptValue}>₹{meeting.cash_at_bank || 0}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Total Receipt:</Text>
          <Text style={styles.receiptValue}>₹{meeting.total_receipt || 0}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Total Expense:</Text>
          <Text style={styles.receiptValue}>₹{meeting.total_expense || 0}</Text>
        </View>
        <View style={[styles.receiptRow, styles.balanceRow]}>
          <Text style={styles.balanceLabel}>Balance:</Text>
          <Text style={styles.balanceValue}>₹{meeting.balance || 0}</Text>
        </View>
      </View>

      {/* Member Demands with Full Details */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Member Demands</Text>
        <Text style={styles.demandSummary}>
          Total Members: {memberDemands.length} | 
          Total Demands: {memberDemands.reduce((sum, m) => sum + m.demands.length, 0)}
        </Text>
        
        <MemberDemandsDisplay memberDemands={memberDemands.flatMap(m => 
          m.demands.map(d => ({
            ...d,
            member_id: m.member_id,
            member_name: m.member_name,
            member_unique_id: m.member_unique_id,
            group_gcode: m.group_gcode,
            group_gname: m.group_gname
          }))
        )} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    fontSize: 14,
    color: '#fff',
    marginTop: 4,
  },
  ppgName: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 4,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  receiptLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  receiptValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  balanceRow: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#3498db',
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  demandSummary: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
  },
  noDataText: {
    color: '#95a5a6',
    fontSize: 16,
  },
});

export default MeetingDetailScreen;