// src/screens/PPGMemberScreen.js - FIXED AUTO-SELECT

import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import {
  ScreenShell, Card, SectionHeader, Dropdown,
  MultiSelect, SubmitButton, theme, useLocationCascade,
} from '../components/SharedComponents';
import * as api from '../api/api';

const positionOptions = [
  { label: "President", value: "President" },
  { label: "Vice President", value: "Vice President" },
  { label: "Secretary", value: "Secretary" },
  { label: "Joint Secretary", value: "Joint Secretary" },
  { label: "Treasurer", value: "Treasurer" },
  { label: "Member", value: "Member" },
];

const memberTypeOptions = [
  { label: "Select Members", value: "members" },
  { label: "Add Non-Members", value: "nonmembers" },
];

export default function PPGMemberScreen({ navigation }) {
  const loc = useLocationCascade();

  // PPG state
  const [ppgList, setPpgList] = useState([]);
  const [ppgId, setPpgId] = useState('');
  const [ppgLoading, setPpgLoad] = useState(false);
  const [selectedPpg, setSelectedPpg] = useState(null);

  // New PPG creation state
  const [showNewPpgModal, setShowNewPpgModal] = useState(false);
  const [newPpgName, setNewPpgName] = useState('');
  const [newPpgLoading, setNewPpgLoading] = useState(false);

  // Group dropdown
  const [groupList, setGroupList] = useState([]);
  const [groupLoading, setGroupLoad] = useState(false);

  // Member type selection
  const [memberType, setMemberType] = useState(null);

  // Members dropdown
  const [memberList, setMembers] = useState([]);
  const [selectedMembers, setSelected] = useState([]);
  const [memberLoading, setMemberLoad] = useState(false);

  // Position
  const [ppgPosition, setPpgPosition] = useState('Member');

  // Non-member add-one-by-one
  const [nonMemberNames, setNonMemberNames] = useState([]);
  const [nonMemberInput, setNonMemberInput] = useState('');

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch PPG list
  useEffect(() => {
    if (!loc.vals.cluster_ccode) {
      setPpgList([]);
      setPpgId('');
      setSelectedPpg(null);
      return;
    }
    
    console.log('🔄 Fetching PPG for cluster:', loc.vals.cluster_ccode);
    setPpgLoad(true);
    
    api.fetchPPGList(loc.vals.cluster_ccode)
      .then(data => {
        console.log('✅ PPG data received:', data);
        const ppgData = Array.isArray(data) ? data : (data?.data || []);
        const formattedList = ppgData.map(d => ({
          label: `${d.ppg_name} (${d.ppg_code || 'N/A'})`,
          value: String(d.id), // Ensure ID is string
          details: d,
          memberCount: d.member_count || 0,
        }));
        setPpgList(formattedList);
      })
      .catch(err => {
        console.error('❌ Failed to fetch PPG list:', err);
        Alert.alert('Error', 'Failed to fetch PPG list: ' + err.message);
      })
      .finally(() => setPpgLoad(false));
  }, [loc.vals.cluster_ccode]);

  // Fetch groups when cluster changes
  useEffect(() => {
    if (!loc.vals.cluster_ccode) {
      setGroupList([]);
      return;
    }
    setGroupLoad(true);
    api.fetchGroups(loc.vals.cluster_ccode)
      .then(data => {
        const groupsData = Array.isArray(data) ? data : (data?.data || []);
        setGroupList(groupsData.map(d => ({
          label: d.group_cname || d.group_gname,
          value: String(d.group_gcode),
        })));
      })
      .catch(err => {
        console.error('Failed to fetch groups:', err);
        Alert.alert('Error', 'Failed to fetch groups: ' + err.message);
      })
      .finally(() => setGroupLoad(false));
  }, [loc.vals.cluster_ccode]);

  // Fetch members when group changes
  useEffect(() => {
    if (!loc.vals.group_gcode) {
      setMembers([]);
      setSelected([]);
      return;
    }
    setMemberLoad(true);
    api.fetchMembers(loc.vals.group_gcode)
      .then(data => {
        const membersData = Array.isArray(data) ? data : (data?.data || []);
        setMembers(membersData.map(d => ({
          label: String(d.unique_id),
          value: String(d.id),
          details: d,
        })));
      })
      .catch(err => {
        console.error('Failed to fetch members:', err);
        Alert.alert('Error', 'Failed to fetch members: ' + err.message);
      })
      .finally(() => setMemberLoad(false));
  }, [loc.vals.group_gcode]);

  // Handle PPG selection
  const handlePpgSelect = (id) => {
    console.log('🔍 Selecting PPG with ID:', id);
    setPpgId(id);
    const selected = ppgList.find(p => p.value === String(id));
    console.log('🔍 Selected PPG data:', selected);
    if (selected) {
      setSelectedPpg(selected.details);
      console.log('✅ PPG selected:', selected.details);
    } else {
      console.warn('⚠️ No PPG found with ID:', id);
    }
    setErrors(e => ({ ...e, ppgId: '' }));
  };

  // 🔥 FIXED: Handle creating new PPG with auto-select
  const handleCreateNewPpg = async () => {
    if (newPpgLoading) return;

    if (!newPpgName.trim()) {
      Alert.alert('Error', 'Please enter a PPG name');
      return;
    }

    // Check if PPG already exists
    const existing = ppgList.find(p =>
      p.label.toLowerCase().includes(newPpgName.trim().toLowerCase())
    );

    if (existing) {
      Alert.alert('Info', 'This PPG already exists!', [
        { text: 'Select it', onPress: () => {
          handlePpgSelect(existing.value);
          setShowNewPpgModal(false);
          setNewPpgName('');
        }},
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    setNewPpgLoading(true);
    
    try {
      console.log('📝 Creating PPG:', newPpgName.trim());
      
      const response = await api.createPPGOriginal({
        state_scode: loc.vals.state_scode,
        district_dcode: loc.vals.district_dcode,
        location_lcode: loc.vals.location_lcode,
        cluster_ccode: loc.vals.cluster_ccode,
        ppg_name: newPpgName.trim(),
        account_number: '000000000000000000',
        bank_name: 'To be updated',
        ifsc_code: 'XXXX0000000',
        signature1: 'To be updated',
        signature2: 'To be updated',
      });

      console.log('✅ PPG creation response:', response);

      // Refresh PPG list
      const refreshData = await api.fetchPPGList(loc.vals.cluster_ccode);
      const ppgData = Array.isArray(refreshData) ? refreshData : (refreshData?.data || []);
      const formattedList = ppgData.map(d => ({
        label: `${d.ppg_name} (${d.ppg_code || 'N/A'})`,
        value: String(d.id),
        details: d,
        memberCount: d.member_count || 0,
      }));
      
      setPpgList(formattedList);

      // 🔥 FIX: Find the newly created PPG
      const newPpg = formattedList.find(p => 
        p.details?.ppg_name?.toLowerCase() === newPpgName.trim().toLowerCase() ||
        p.label.toLowerCase().includes(newPpgName.trim().toLowerCase())
      );

      console.log('🔍 New PPG found:', newPpg);

      if (newPpg) {
        // 🔥 Set the PPG ID and selected PPG
        setPpgId(newPpg.value);
        setSelectedPpg(newPpg.details);
        console.log('✅ Auto-selected new PPG:', newPpg.details);
        Alert.alert('✅ Success', `"${newPpgName.trim()}" created and selected!`);
      } else {
        // Fallback: Try to find by response ID
        const responseId = response?.id || response?.data?.id;
        if (responseId) {
          const found = formattedList.find(p => p.value === String(responseId));
          if (found) {
            setPpgId(found.value);
            setSelectedPpg(found.details);
            console.log('✅ Auto-selected by response ID:', found.details);
            Alert.alert('✅ Success', `"${newPpgName.trim()}" created and selected!`);
          }
        } else {
          Alert.alert('✅ PPG Created', 'PPG created. Please select it from the dropdown.');
        }
      }

      setShowNewPpgModal(false);
      setNewPpgName('');
      
    } catch (err) {
      console.error('❌ Failed to create PPG:', err);
      Alert.alert('Error', err.message || 'Failed to create PPG');
    } finally {
      setNewPpgLoading(false);
    }
  };

  const toggleMember = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setErrors(e => ({ ...e, members: '' }));
  };

  // Non-member handlers
  const addNonMember = () => {
    const name = nonMemberInput.trim();
    if (!name) {
      Alert.alert('Info', 'Please type a name first');
      return;
    }
    if (nonMemberNames.length >= 30) {
      Alert.alert('Limit Reached', 'Maximum 30 non-members allowed');
      return;
    }
    if (nonMemberNames.includes(name)) {
      Alert.alert('Info', 'This name is already added');
      return;
    }
    setNonMemberNames(prev => [...prev, name]);
    setNonMemberInput('');
    setErrors(e => ({ ...e, members: '' }));
  };

  const removeNonMember = (name) => {
    setNonMemberNames(prev => prev.filter(n => n !== name));
  };

  // Reset selections when member type changes
  const handleMemberTypeSelect = (type) => {
    setMemberType(type);
    setSelected([]);
    setNonMemberNames([]);
    setNonMemberInput('');
    if (type === 'nonmembers') {
      loc.onGroup('');
    }
    setErrors(e => ({ ...e, memberType: '', members: '' }));
  };

  const validate = () => {
    const e = {};
    if (!loc.vals.state_scode) e.state = 'Required';
    if (!loc.vals.district_dcode) e.district = 'Required';
    if (!loc.vals.location_lcode) e.location = 'Required';
    if (!loc.vals.cluster_ccode) e.cluster = 'Required';
    if (!ppgId) e.ppgId = 'Select or create a PPG';
    
    if (!memberType) {
      e.memberType = 'Select member type';
    } else if (memberType === 'members') {
      if (!loc.vals.group_gcode) e.group = 'Select a group';
      if (selectedMembers.length === 0) e.members = 'Select at least one member';
    } else if (memberType === 'nonmembers') {
      if (nonMemberNames.length === 0) e.members = 'Add at least one non-member name';
    }
    
    if (!ppgPosition) e.ppgPosition = 'Position required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // 🔥 FIXED: Handle submit with better validation
  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Fix errors', 'Complete all required fields.');
      return;
    }

    // 🔥 Check if selectedPpg exists
    if (!selectedPpg) {
      console.log('⚠️ selectedPpg is null, trying to find it from ppgId');
      // Try to find the selected PPG from the list
      const found = ppgList.find(p => p.value === String(ppgId));
      if (found && found.details) {
        setSelectedPpg(found.details);
        console.log('✅ Found PPG from list:', found.details);
      } else {
        Alert.alert('Error', 'PPG details not found. Please select a valid PPG.');
        return;
      }
    }

    // Double check after potential fix
    if (!selectedPpg) {
      Alert.alert('Error', 'PPG details not found. Please select a valid PPG.');
      return;
    }

    setSaving(true);
    try {
      const selectedMemberIds = selectedMembers.map(id => parseInt(id));

      const payload = {
        ppg_id: parseInt(ppgId),
        state_scode: loc.vals.state_scode,
        district_dcode: loc.vals.district_dcode,
        location_lcode: loc.vals.location_lcode,
        cluster_ccode: loc.vals.cluster_ccode,
        ppg_position: ppgPosition,
        member_ids: selectedMemberIds,
        non_member_names: nonMemberNames.join(', '),
      };

      // Always include group_gcode
      if (memberType === 'members' && loc.vals.group_gcode) {
        payload.group_gcode = loc.vals.group_gcode;
      } else if (memberType === 'nonmembers') {
        if (groupList.length > 0) {
          payload.group_gcode = groupList[0].value;
        } else {
          payload.group_gcode = '00000000';
        }
      }

      console.log('📤 Submitting payload:', payload);

      await api.createPPGMembers(payload);

      Alert.alert(
        '✅ Saved',
        `${selectedMembers.length} member(s)${nonMemberNames.length ? ` and ${nonMemberNames.length} non-member(s)` : ''} assigned to PPG.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('Error saving members:', err);
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to save members');
    } finally {
      setSaving(false);
    }
  };

  // Render member selection based on memberType
  const renderMemberSelection = () => {
    if (!memberType) return null;

    if (memberType === 'members') {
      return (
        <>
          <Dropdown 
            label="Select Group" 
            required 
            value={loc.vals.group_gcode}
            items={groupList} 
            loading={groupLoading}
            disabled={!loc.vals.cluster_ccode}
            onSelect={loc.onGroup}
            error={errors.group}
            placeholder={loc.vals.cluster_ccode ? 'Select group' : 'Select cluster first'} 
          />

          {loc.vals.group_gcode && (
            <>
              <MultiSelect 
                label="Members" 
                required
                items={memberList} 
                selected={selectedMembers}
                onToggle={toggleMember} 
                loading={memberLoading}
                disabled={!loc.vals.group_gcode} 
                error={errors.members} 
              />

              {selectedMembers.length > 0 && (
                <View style={s.summary}>
                  <Text style={s.summaryText}>
                    ✓ {selectedMembers.length} of {memberList.length} members selected
                  </Text>
                  <TouchableOpacity onPress={() => setSelected([])}>
                    <Text style={s.clearBtn}>Clear all</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      );
    }

    if (memberType === 'nonmembers') {
      return (
        <>
          <View style={s.nonMemberInputRow}>
            <TextInput
              style={s.nonMemberInput}
              placeholder="Type non-member name"
              value={nonMemberInput}
              onChangeText={setNonMemberInput}
              onSubmitEditing={addNonMember}
              returnKeyType="done"
            />
            <TouchableOpacity style={s.addButton} onPress={addNonMember}>
              <Text style={s.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.counterText}>
            {nonMemberNames.length} / 30 members added
          </Text>

          {nonMemberNames.length > 0 && (
            <View style={s.chipContainer}>
              {nonMemberNames.map((name) => (
                <View key={name} style={s.chip}>
                  <Text style={s.chipText}>{name}</Text>
                  <TouchableOpacity onPress={() => removeNonMember(name)}>
                    <Text style={s.chipRemove}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {errors.members && <Text style={s.errorText}>{errors.members}</Text>}
        </>
      );
    }

    return null;
  };

  return (
    <ScreenShell>
      <ScrollView>
        <Card>
          <SectionHeader title="Location" icon="📍" />
          <Dropdown label="State" required value={loc.vals.state_scode}
            items={loc.lists.states} loading={loc.loading.states}
            onSelect={loc.onState} error={errors.state} />
          <Dropdown label="District" required value={loc.vals.district_dcode}
            items={loc.lists.districts} loading={loc.loading.districts}
            disabled={!loc.vals.state_scode} onSelect={loc.onDistrict} error={errors.district} />
          <Dropdown label="Location" required value={loc.vals.location_lcode}
            items={loc.lists.locations} loading={loc.loading.locations}
            disabled={!loc.vals.district_dcode} onSelect={loc.onLocation} error={errors.location} />
          <Dropdown label="Cluster" required value={loc.vals.cluster_ccode}
            items={loc.lists.clusters} loading={loc.loading.clusters}
            disabled={!loc.vals.location_lcode} onSelect={loc.onCluster} error={errors.cluster} />
        </Card>

        <Card>
          <SectionHeader title="PPG Selection" icon="🌿" />
          
          {/* SIMPLIFIED PPG SELECTION */}
          <Dropdown 
            label="Select PPG" 
            required 
            value={ppgId}
            items={ppgList} 
            loading={ppgLoading}
            disabled={!loc.vals.cluster_ccode || showNewPpgModal}
            onSelect={handlePpgSelect}
            error={errors.ppgId}
            placeholder={loc.vals.cluster_ccode ? 'Select a PPG' : 'Select cluster first'} 
          />

      

          {/* 🔥 Show warning if PPG selected but details missing */}
          {ppgId && !selectedPpg && (
            <View style={s.warningPpgInfo}>
              <Text style={s.warningPpgText}>⚠️ PPG selected but details not loaded</Text>
              <Text style={s.warningPpgSubText}>Please try selecting again or refresh</Text>
            </View>
          )}

          {/* Create New PPG Button - Always visible */}
          {!showNewPpgModal ? (
            <TouchableOpacity 
              style={s.createPpgBtn}
              onPress={() => setShowNewPpgModal(true)}
              disabled={!loc.vals.cluster_ccode}
            >
              <Text style={s.createPpgBtnText}>+ Create New PPG</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.newPpgContainer}>
              <Text style={s.newPpgTitle}>Create New PPG</Text>
              <TextInput
                style={s.newPpgInput}
                placeholder="Enter PPG name"
                value={newPpgName}
                onChangeText={setNewPpgName}
                autoFocus
              />
              <View style={s.newPpgActions}>
                <TouchableOpacity
                  style={[s.newPpgBtn, s.cancelBtn]}
                  onPress={() => {
                    setShowNewPpgModal(false);
                    setNewPpgName('');
                  }}
                >
                  <Text style={[s.newPpgBtnText, { color: '#333' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.newPpgBtn, s.saveBtn]}
                  onPress={handleCreateNewPpg}
                  disabled={newPpgLoading}
                >
                  <Text style={s.newPpgBtnText}>
                    {newPpgLoading ? 'Creating...' : 'Create PPG'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Card>

        <Card>
          <SectionHeader title="Member Selection" icon="👥" />
          
          {/* Member Type Selection */}
          <View style={s.memberTypeContainer}>
            <Text style={s.memberTypeLabel}>Select Member Type *</Text>
            <View style={s.memberTypeOptions}>
              {memberTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    s.memberTypeOption,
                    memberType === option.value && s.memberTypeOptionSelected,
                  ]}
                  onPress={() => handleMemberTypeSelect(option.value)}
                >
                  <Text
                    style={[
                      s.memberTypeOptionText,
                      memberType === option.value && s.memberTypeOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.memberType && <Text style={s.errorText}>{errors.memberType}</Text>}
          </View>

          {/* Render member selection based on type */}
          {renderMemberSelection()}

          {/* Position */}
          {memberType && (
            <Dropdown 
              label="Position" 
              required 
              value={ppgPosition}
              items={positionOptions}
              onSelect={setPpgPosition}
              error={errors.ppgPosition}
              placeholder="Select Designation" 
            />
          )}
        </Card>

        <SubmitButton 
          title="Submit Details" 
          onPress={handleSubmit} 
          loading={saving} 
        />
      </ScrollView>
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  // Selected PPG info
  selectedPpgInfo: {
    padding: 12,
    backgroundColor: theme.greenPale,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: theme.green,
  },
  selectedPpgName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.green,
  },
  selectedPpgCode: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },
  selectedPpgMembers: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  // Warning PPG info
  warningPpgInfo: {
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  warningPpgText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
  },
  warningPpgSubText: {
    fontSize: 12,
    color: '#856404',
    marginTop: 2,
  },

  // Create PPG Button
  createPpgBtn: {
    backgroundColor: theme.green,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createPpgBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // New PPG Modal
  newPpgContainer: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.green,
    marginTop: 8,
  },
  newPpgTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.green,
    marginBottom: 12,
  },
  newPpgInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  newPpgActions: {
    flexDirection: 'row',
    gap: 10,
  },
  newPpgBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f0f0f0',
  },
  saveBtn: {
    backgroundColor: theme.green,
  },
  newPpgBtnText: {
    fontWeight: 'bold',
    color: '#fff',
  },

  // Member Type
  memberTypeContainer: {
    marginBottom: 16,
  },
  memberTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberTypeOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  memberTypeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  memberTypeOptionSelected: {
    borderColor: theme.green,
    backgroundColor: theme.greenPale,
  },
  memberTypeOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  memberTypeOptionTextSelected: {
    color: theme.green,
    fontWeight: '600',
  },

  // Non-member input
  nonMemberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  nonMemberInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  addButton: {
    padding: 12,
    backgroundColor: theme.green,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Chips
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.greenPale,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.greenBorder,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    color: theme.green,
    fontWeight: '500',
  },
  chipRemove: {
    fontSize: 13,
    color: theme.error,
    fontWeight: 'bold',
  },

  // Summary
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.greenPale,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.green,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.green,
  },
  clearBtn: {
    fontSize: 12,
    color: theme.error,
  },

  // Error
  errorText: {
    color: theme.error,
    fontSize: 12,
    marginTop: 4,
  },

  // Counter
  counterText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'right',
  },
});