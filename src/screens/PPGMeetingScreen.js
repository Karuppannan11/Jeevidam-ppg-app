// src/screens/PPGMeetingScreen.js - Complete working version

import React, { useState, useEffect } from 'react';
import { 
  Alert, View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Platform, TextInput, FlatList 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ScreenShell, Card, SectionHeader, FormInput,
  Dropdown, SubmitButton, theme,
} from '../components/SharedComponents';
import * as api from '../api/api';

export default function PPGMeetingScreen({ navigation }) {
  // PPG (from ppg_master with correct IDs)
  const [ppgList, setPpgList] = useState([]);
  const [ppgCode, setPpgCode] = useState('');
  const [selectedPpg, setSelectedPpg] = useState(null);
  const [ppgLoading, setPpgLoading] = useState(false);

  // Products for selected PPG
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Group (from ppgname_tables, filtered by ppg_code)
  const [groupList, setGroupList] = useState([]);
  const [groupGcode, setGroupGcode] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupLoading, setGroupLoading] = useState(false);

  // Members - Fetched from ppg_members table
  const [memberList, setMemberList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  
  // SELECTED MEMBERS (MULTI SELECT)
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);

  // Meeting Details with Date/Time
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [venue, setVenue] = useState('');
  const [discussions, setDiscussions] = useState('');
  const [majorResolutions, setMajorResolutions] = useState('');

  // Date/Time Picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());

  // Member Demands - Each selected member has their own demands
  const [memberDemands, setMemberDemands] = useState({});

  // Receipt Details
  const [cashAtBank, setCashAtBank] = useState('');
  const [totalReceipt, setTotalReceipt] = useState('');
  const [totalExpense, setTotalExpense] = useState('');
  const [voucherNumber, setVoucherNumber] = useState('');

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load ALL PPGs from ppg_master with correct IDs
  useEffect(() => {
    fetchAllPPGs();
  }, []);

  const fetchAllPPGs = async () => {
    setPpgLoading(true);
    try {
      const data = await api.fetchAllPPGsForProducts();
      const formatted = data.map(d => ({
        label: d.ppg_name,
        value: d.ppg_code,
        details: { ...d, id: d.id }
      }));
      setPpgList(formatted);
    } catch (err) {
      console.error('Failed to fetch PPG list:', err);
      Alert.alert('Error', 'Failed to fetch PPG list: ' + err.message);
    } finally {
      setPpgLoading(false);
    }
  };

  // Fetch products when PPG changes
  useEffect(() => {
    if (!ppgCode || !selectedPpg?.id) {
      setProducts([]);
      return;
    }
    setProductsLoading(true);
    api.fetchPPGProducts(selectedPpg.id)
      .then(data => {
        setProducts(data || []);
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        Alert.alert('Error', 'Failed to fetch products: ' + err.message);
      })
      .finally(() => setProductsLoading(false));
  }, [ppgCode, selectedPpg?.id]);

  // Fetch groups when PPG changes
  useEffect(() => {
    if (!ppgCode) {
      setGroupList([]);
      setGroupGcode('');
      setSelectedGroup(null);
      return;
    }
    setGroupLoading(true);
    api.fetchPPGNameGroups(ppgCode)
      .then(data => {
        const formatted = data.map(d => ({
          label: d.group_gname,
          value: d.group_gcode,
          details: d,
        }));
        setGroupList(formatted);
      })
      .catch(err => {
        console.error('Failed to fetch groups:', err);
        Alert.alert('Error', 'Failed to fetch groups: ' + err.message);
      })
      .finally(() => setGroupLoading(false));
  }, [ppgCode]);

  // Fetch members from ppg_members table when group changes
  useEffect(() => {
    if (!ppgCode || !groupGcode || !selectedPpg?.id) {
      setMemberList([]);
      setSelectedMemberIds([]);
      setMemberDemands({});
      return;
    }
    
    setMembersLoading(true);
    api.fetchPPGMembersFromTable(selectedPpg.id, groupGcode)
      .then(data => {
        if (!data || data.length === 0) {
          setMemberList([]);
          return;
        }
        const formatted = data.map((m, index) => ({
          label: m.member_unique_id || m.member_codes || `Member ${index + 1}`,
          value: String(m.id || m.member_id || `member_${index + 1}`),
          details: m,
        }));
        setMemberList(formatted);
      })
      .catch(err => {
        console.error('Failed to fetch members:', err);
        Alert.alert('Error', 'Failed to fetch members: ' + err.message);
        setMemberList([]);
      })
      .finally(() => setMembersLoading(false));
  }, [ppgCode, groupGcode, selectedPpg?.id]);

  const handlePpgSelect = (code) => {
    setPpgCode(code);
    const selected = ppgList.find(p => p.value === code);
    setSelectedPpg(selected?.details || null);
    setGroupGcode('');
    setSelectedGroup(null);
    setSelectedMemberIds([]);
    setMemberDemands({});
    setErrors(e => ({ ...e, ppg: '' }));
  };

  const handleGroupSelect = (gcode) => {
    setGroupGcode(gcode);
    const selected = groupList.find(g => g.value === gcode);
    setSelectedGroup(selected?.details || null);
    setSelectedMemberIds([]);
    setMemberDemands({});
    setErrors(e => ({ ...e, group: '' }));
  };

  // TOGGLE MEMBER SELECTION (Multi-select)
  const toggleMemberSelection = (memberId, memberName) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        const newSelected = prev.filter(id => id !== memberId);
        setMemberDemands(prevDemands => {
          const newDemands = { ...prevDemands };
          delete newDemands[memberId];
          return newDemands;
        });
        return newSelected;
      } else {
        return [...prev, memberId];
      }
    });
    setErrors(e => ({ ...e, members: '' }));
  };

  // Get product dropdown items
  const getProductItems = () => {
    return products.map(p => ({
      label: `${p.product_name} (${p.unit_name || 'N/A'})`,
      value: String(p.id)
    }));
  };

  // Member Demand Handlers
  const addDemandForMember = (memberId) => {
    setMemberDemands(prev => ({
      ...prev,
      [memberId]: [...(prev[memberId] || []), { 
        product_id: '', 
        product_name: '', 
        quantity: '', 
        unit_price: '', 
        total: 0
      }]
    }));
  };

  const removeDemandForMember = (memberId, index) => {
    setMemberDemands(prev => {
      const memberDemands = [...(prev[memberId] || [])];
      memberDemands.splice(index, 1);
      if (memberDemands.length === 0) {
        const newDemands = { ...prev };
        delete newDemands[memberId];
        return newDemands;
      }
      return { ...prev, [memberId]: memberDemands };
    });
  };

  const updateDemandForMember = (memberId, index, field, value) => {
    setMemberDemands(prev => {
      const memberDemands = [...(prev[memberId] || [])];
      memberDemands[index][field] = value;
      
      if (field === 'product_id') {
        const product = products.find(p => String(p.id) === String(value));
        memberDemands[index].product_name = product?.product_name || '';
      }
      
      const qty = parseFloat(memberDemands[index].quantity) || 0;
      const price = parseFloat(memberDemands[index].unit_price) || 0;
      memberDemands[index].total = qty * price;
      
      return { ...prev, [memberId]: memberDemands };
    });
  };

  const getMemberTotal = (memberId) => {
    const demands = memberDemands[memberId] || [];
    return demands.reduce((sum, d) => {
      const qty = parseFloat(d.quantity) || 0;
      const price = parseFloat(d.unit_price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const getGrandTotal = () => {
    let total = 0;
    selectedMemberIds.forEach(memberId => {
      total += getMemberTotal(memberId);
    });
    return total;
  };

  // Format time for display
  const formatTimeDisplay = (time24) => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Date/Time Handlers
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      setTempDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setMeetingDate(formattedDate);
      setErrors(e => ({ ...e, meetingDate: '' }));
    }
  };

  const onTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (selectedTime) {
      setTempTime(selectedTime);
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const seconds = selectedTime.getSeconds().toString().padStart(2, '0');
      setMeetingTime(`${hours}:${minutes}:${seconds}`);
      setErrors(e => ({ ...e, meetingTime: '' }));
    }
  };

// In PPGMeetingScreen.js - Enhanced validation
const validate = () => {
  const e = {};
  if (!ppgCode) e.ppg = 'Select a PPG';
  if (!groupGcode) e.group = 'Select a group';
  if (!meetingDate) e.meetingDate = 'Select meeting date';
  if (selectedMemberIds.length === 0) e.members = 'Select at least one member';
  
  // Check each selected member has demands
  let membersWithDemands = [];
  let membersWithoutDemands = [];
  
  selectedMemberIds.forEach(memberId => {
    const demands = memberDemands[memberId] || [];
    const validDemands = demands.filter(d => d.product_id && d.product_name);
    if (validDemands.length > 0) {
      membersWithDemands.push(memberId);
    } else {
      membersWithoutDemands.push(memberId);
    }
  });
  
  if (membersWithDemands.length === 0) {
    e.demands = 'Add at least one demand for a selected member';
  } else if (membersWithoutDemands.length > 0) {
    const memberNames = membersWithoutDemands.map(id => {
      const member = memberList.find(m => m.value === id);
      return member?.label || id;
    });
    e.demands = `These members have no demands: ${memberNames.join(', ')}`;
  }
  
  if (cashAtBank && isNaN(parseFloat(cashAtBank))) e.cashAtBank = 'Enter a valid number';
  if (totalReceipt && isNaN(parseFloat(totalReceipt))) e.totalReceipt = 'Enter a valid number';
  if (totalExpense && isNaN(parseFloat(totalExpense))) e.totalExpense = 'Enter a valid number';
  
  setErrors(e);
  console.log('Validation result:', Object.keys(e).length === 0 ? '✅ Valid' : '❌ Invalid', e);
  return Object.keys(e).length === 0;
};

  const calculateBalance = () => {
    const cash = parseFloat(cashAtBank) || 0;
    const receipt = parseFloat(totalReceipt) || 0;
    const expense = parseFloat(totalExpense) || 0;
    return cash + receipt - expense;
  };
// In PPGMeetingScreen.js - Update the handleSubmit function
// PPGMeetingScreen.js - Updated handleSubmit with proper member demand storage

// PPGMeetingScreen.js - Ensure participants are properly sent

const handleSubmit = async () => {
  if (!validate()) {
    Alert.alert('Fix errors', 'Please correct the highlighted fields.');
    return;
  }

  setSaving(true);
  try {
    // 🔥 CRITICAL: Get selected members with all required fields
    const selectedMembers = memberList.filter(m => selectedMemberIds.includes(m.value));
    
    // 🔥 Format participants with proper fields
    const participants = selectedMembers.map(m => ({
      id: m.value,  // or m.details?.id
      member_id: m.value,  // Add this for compatibility
      unique_id: m.details?.member_unique_id || m.details?.member_codes || m.value,
      member_unique_id: m.details?.member_unique_id || m.details?.member_codes || m.value,
      member_name: m.label || m.details?.member_unique_id || m.value,
      name: m.label || m.details?.member_unique_id || m.value,  // Add this for compatibility
      group_gcode: groupGcode,
      group_gname: selectedGroup?.group_gname || '',
    }));

    console.log('📦 ===== PARTICIPANTS BEING SENT =====');
    console.log(`📦 Total participants: ${participants.length}`);
    participants.forEach((p, index) => {
      console.log(`📦 Participant ${index + 1}: ${p.member_name} (${p.id})`);
    });

    // Prepare member demands
    const memberDemandData = [];
    
    selectedMemberIds.forEach(memberId => {
      const member = memberList.find(m => m.value === memberId);
      const memberName = member?.label || member?.details?.member_unique_id || memberId;
      const memberUniqueId = member?.details?.member_unique_id || memberId;
      const demands = memberDemands[memberId] || [];
      
      demands.forEach((demand, index) => {
        if (demand.product_id && demand.product_name) {
          const demandItem = {
            ppg_id: selectedPpg?.id || null,
            ppg_code: ppgCode,
            ppg_name: selectedPpg?.ppg_name || '',
            group_gcode: groupGcode || '',
            group_gname: selectedGroup?.group_gname || '',
            member_id: String(memberId),
            member_name: memberName || '',
            member_unique_id: memberUniqueId || '',
            product_id: parseInt(demand.product_id) || null,
            product_name: demand.product_name || '',
            quantity: parseFloat(demand.quantity) || 0,
            unit_price: parseFloat(demand.unit_price) || 0,
            total: parseFloat(demand.total) || 0,
          };
          memberDemandData.push(demandItem);
        }
      });
    });

    const meetingData = {
      ppg_id: selectedPpg?.id || null,
      ppg_code: ppgCode,
      ppg_name: selectedPpg?.ppg_name || '',
      state_scode: selectedPpg?.state_scode || null,
      state_sname: selectedPpg?.state_sname || '',
      district_dcode: selectedPpg?.district_dcode || null,
      district_dname: selectedPpg?.district_dname || '',
      location_lcode: selectedPpg?.location_lcode || null,
      location_lname: selectedPpg?.location_lname || '',
      cluster_ccode: selectedPpg?.cluster_ccode || null,
      cluster_cname: selectedPpg?.cluster_cname || '',
      meeting_date: meetingDate,
      meeting_time: meetingTime || null,
      venue: venue || null,
      discussions: discussions || null,
      major_resolutions: majorResolutions || null,
      participants: participants,  // 🔥 This is properly formatted
      cash_at_bank: parseFloat(cashAtBank) || 0,
      total_receipt: parseFloat(totalReceipt) || 0,
      total_expense: parseFloat(totalExpense) || 0,
      voucher_number: voucherNumber || null,
      balance: calculateBalance(),
      member_demands: memberDemandData,
      fpo_supply: [],
      fpo_demand: [],
    };

    console.log('📦 Full meeting data being sent:', JSON.stringify(meetingData, null, 2));

    const meetingResult = await api.createPPGMeeting(meetingData);

    Alert.alert(
      '✅ Success',
      `Meeting recorded with ${participants.length} members having ${memberDemandData.length} demands!`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  } catch (err) {
    console.error('Error saving meeting:', err);
    Alert.alert('Error', err.message || 'Failed to save meeting');
  } finally {
    setSaving(false);
  }
};


  // Render member item with checkbox (multi-select)
  const renderMemberItem = ({ item }) => {
    const memberId = item.value;
    const isSelected = selectedMemberIds.includes(memberId);
    const displayName = item.label || item.details?.member_unique_id || item.details?.member_codes || `Member ${memberId}`;
    const demands = memberDemands[memberId] || [];
    const total = getMemberTotal(memberId);

    return (
      <View style={[s.memberItem, isSelected && s.memberItemSelected]}>
        <TouchableOpacity 
          style={s.memberSelector}
          onPress={() => toggleMemberSelection(memberId, displayName)}
        >
          <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
            {isSelected && <Text style={s.checkmark}>✓</Text>}
          </View>
          <View style={s.memberDetails}>
            <Text style={s.memberName}>{displayName}</Text>
            {isSelected && demands.length > 0 && (
              <Text style={s.demandSummary}>
                {demands.length} demand(s) | ₹{total.toFixed(2)}
              </Text>
            )}
          </View>
          {isSelected && demands.length > 0 && (
            <View style={s.demandBadge}>
              <Text style={s.demandBadgeText}>{demands.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        {isSelected && (
          <View style={s.demandsContainer}>
            {demands.length === 0 && (
              <TouchableOpacity 
                style={s.addFirstDemandBtn}
                onPress={() => addDemandForMember(memberId)}
              >
                <Text style={s.addFirstDemandText}>+ Add First Demand for {displayName}</Text>
              </TouchableOpacity>
            )}

            {demands.map((demand, index) => (
              <View key={index} style={s.demandItem}>
                <View style={s.demandHeader}>
                  <Text style={s.demandMemberName}>👤 {displayName}</Text>
                  <TouchableOpacity 
                    style={s.removeDemandButton}
                    onPress={() => removeDemandForMember(memberId, index)}
                  >
                    <Text style={s.removeDemandText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={s.demandRow}>
                  <View style={s.demandField}>
                    <Text style={s.demandLabel}>Product</Text>
                    <Dropdown
                      label=""
                      value={demand.product_id}
                      items={getProductItems()}
                      loading={productsLoading}
                      onSelect={(val) => updateDemandForMember(memberId, index, 'product_id', val)}
                      placeholder="Select product"
                      error={null}
                    />
                  </View>
                </View>

                <View style={s.demandRow}>
                  <View style={s.demandFieldSmall}>
                    <Text style={s.demandLabel}>Quantity</Text>
                    <TextInput
                      style={s.demandInput}
                      value={demand.quantity}
                      onChangeText={(val) => updateDemandForMember(memberId, index, 'quantity', val)}
                      placeholder="Qty"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={s.demandFieldSmall}>
                    <Text style={s.demandLabel}>Unit Price</Text>
                    <TextInput
                      style={s.demandInput}
                      value={demand.unit_price}
                      onChangeText={(val) => updateDemandForMember(memberId, index, 'unit_price', val)}
                      placeholder="Price"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={s.demandFieldSmall}>
                    <Text style={s.demandLabel}>Total</Text>
                    <Text style={s.demandTotal}>
                      ₹{demand.total.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            
            {demands.length > 0 && (
              <TouchableOpacity 
                style={s.addDemandBtn}
                onPress={() => addDemandForMember(memberId)}
              >
                <Text style={s.addDemandBtnText}>+ Add Another Demand for {displayName}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenShell>
      <ScrollView>
        {/* PPG Selection */}
        <Card>
          <SectionHeader title="Select PPG" icon="🌿" />
          <Dropdown
            label="PPG"
            required
            value={ppgCode}
            items={ppgList}
            loading={ppgLoading}
            onSelect={handlePpgSelect}
            error={errors.ppg}
            placeholder="Select a PPG"
          />
          {selectedPpg && (
            <View style={s.selectedInfo}>
              <Text style={s.detailText}>📋 {selectedPpg.ppg_name}</Text>
              <Text style={s.detailTextSmall}>Code: {selectedPpg.ppg_code}</Text>
              {/* <Text style={s.detailTextSmall}>ID: {selectedPpg.id}</Text> */}
              <View style={s.locationInfo}>
                {/* <Text style={s.detailTextSmall}>
                  📍 {selectedPpg.state_sname} → {selectedPpg.district_dname} → {selectedPpg.location_lname} → {selectedPpg.cluster_cname}
                </Text> */}
              </View>
              {products.length > 0 && (
                <Text style={s.detailTextSmall}>📦 {products.length} products available</Text>
              )}
            </View>
          )}
        </Card>

        {/* Group Selection */}
        {ppgCode && (
          <Card>
            <SectionHeader title="Select Group" icon="👥" />
            <Dropdown
              label="Group"
              required
              value={groupGcode}
              items={groupList}
              loading={groupLoading}
              onSelect={handleGroupSelect}
              error={errors.group}
              placeholder="Select a group"
            />
            {selectedGroup && (
              <View style={s.selectedInfo}>
                <Text style={s.detailText}>👥 {selectedGroup.group_gname}</Text>
                <Text style={s.detailTextSmall}>Code: {selectedGroup.group_gcode}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Members Selection */}
        {groupGcode && (
          <Card>
            <SectionHeader title="Select Members (Tap to select multiple)" icon="☑️" />
            <Text style={s.hintText}>Tap on a member to select/unselect. Selected members can have demands.</Text>
            
            {errors.members && <Text style={s.errorText}>{errors.members}</Text>}
            {errors.demands && <Text style={s.errorText}>{errors.demands}</Text>}
            
            {membersLoading ? (
              <Text style={s.loadingText}>Loading members...</Text>
            ) : memberList.length === 0 ? (
              <Text style={s.noMembersText}>No members found for this group</Text>
            ) : (
              <FlatList
                data={memberList}
                keyExtractor={(item) => item.value}
                renderItem={renderMemberItem}
                scrollEnabled={false}
              />
            )}

            {selectedMemberIds.length > 0 && (
              <View style={s.summaryContainer}>
                <Text style={s.summaryText}>☑️ {selectedMemberIds.length} member(s) selected</Text>
                <Text style={s.summaryTotal}>Total Demands: ₹{getGrandTotal().toFixed(2)}</Text>
              </View>
            )}
          </Card>
        )}

        {/* Meeting Details */}
        {groupGcode && selectedMemberIds.length > 0 && (
          <>
            <Card>
              <SectionHeader title="Meeting Details" icon="📅" />
              <View style={s.dateTimeContainer}>
                <Text style={s.label}>Meeting Date <Text style={s.required}>*</Text></Text>
                <TouchableOpacity
                  style={[s.dateTimeInput, errors.meetingDate && s.inputError]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[s.dateTimeText, !meetingDate && s.placeholderText]}>
                    {meetingDate || 'Select Meeting Date'}
                  </Text>
                  <Text style={s.calendarIcon}>📅</Text>
                </TouchableOpacity>
                {errors.meetingDate && <Text style={s.errorText}>{errors.meetingDate}</Text>}
              </View>

              <View style={s.dateTimeContainer}>
                <Text style={s.label}>Meeting Time</Text>
                <TouchableOpacity
                  style={s.dateTimeInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={[s.dateTimeText, !meetingTime && s.placeholderText]}>
                    {meetingTime ? formatTimeDisplay(meetingTime) : 'Select Meeting Time'}
                  </Text>
                  <Text style={s.clockIcon}>🕐</Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date(2020, 0, 1)}
                  maximumDate={new Date(2030, 11, 31)}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={tempTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onTimeChange}
                />
              )}

              <FormInput label="Venue" value={venue} onChangeText={setVenue} placeholder="Enter meeting venue" />
              <FormInput label="Discussions" value={discussions} onChangeText={setDiscussions} placeholder="Key discussion points" multiline numberOfLines={3} />
              <FormInput label="Major Resolutions" value={majorResolutions} onChangeText={setMajorResolutions} placeholder="Major decisions taken" multiline numberOfLines={3} />
            </Card>

            <Card>
              <SectionHeader title="Receipt Details" icon="💰" />
              <FormInput label="Cash at Bank" value={cashAtBank} onChangeText={setCashAtBank} placeholder="Enter cash at bank amount" keyboardType="numeric" error={errors.cashAtBank} />
              <FormInput label="Total Receipt" value={totalReceipt} onChangeText={setTotalReceipt} placeholder="Enter total receipt amount" keyboardType="numeric" error={errors.totalReceipt} />
              <FormInput label="Total Expense / Voucher" value={totalExpense} onChangeText={setTotalExpense} placeholder="Enter total expense/voucher amount" keyboardType="numeric" error={errors.totalExpense} />
              <FormInput label="Voucher Number" value={voucherNumber} onChangeText={setVoucherNumber} placeholder="Enter voucher number (optional)" />
              {(cashAtBank || totalReceipt || totalExpense) && (
                <View style={s.balanceInfo}>
                  <Text style={s.balanceText}>Balance: ₹{calculateBalance().toFixed(2)}</Text>
                  <Text style={s.balanceFormula}>({cashAtBank || 0} + {totalReceipt || 0} - {totalExpense || 0})</Text>
                </View>
              )}
            </Card>

            <SubmitButton title="Save Meeting" onPress={handleSubmit} loading={saving} />
          </>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  selectedInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.greenPale,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.green,
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.green,
  },
  detailTextSmall: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 2,
  },
  locationInfo: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  dateTimeContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  required: {
    color: '#FF0000',
  },
  dateTimeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholderText: {
    color: '#999999',
  },
  calendarIcon: { fontSize: 20 },
  clockIcon: { fontSize: 20 },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
  balanceInfo: {
    marginTop: 12,
    padding: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  balanceFormula: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  noMembersText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  // Member Item Styles
  memberItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  memberItemSelected: {
    borderColor: theme.green,
    borderWidth: 2,
  },
  memberSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  checkboxSelected: {
    backgroundColor: theme.green,
    borderColor: theme.green,
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  memberDetails: { flex: 1 },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  demandSummary: {
    fontSize: 12,
    color: theme.green,
    marginTop: 2,
    fontWeight: '500',
  },
  demandBadge: {
    backgroundColor: theme.green,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  demandBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  demandsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  demandItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  demandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  demandMemberName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.green,
  },
  demandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  demandField: { flex: 1 },
  demandFieldSmall: { flex: 1 },
  demandLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
    marginBottom: 2,
  },
  demandInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  demandTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.green,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    textAlign: 'center',
  },
  removeDemandButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeDemandText: {
    fontSize: 18,
    color: '#dc3545',
  },
  addFirstDemandBtn: {
    backgroundColor: theme.green,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  addFirstDemandText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addDemandBtn: {
    backgroundColor: theme.greenPale,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.greenBorder,
    alignItems: 'center',
  },
  addDemandBtnText: {
    color: theme.green,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: 12,
    padding: 15,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#856404',
    marginTop: 4,
  },
});