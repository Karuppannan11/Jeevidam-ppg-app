// src/screens/PPGOriginal.js - UPDATED VERSION

import React, { useState, useEffect, useRef } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import {
  ScreenShell, Card, SectionHeader, FormInput,
  Dropdown, SubmitButton, theme, useLocationCascade,
} from '../components/SharedComponents';
import * as api from '../api/api';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACNO_RE = /^\d{9,18}$/;

export default function PPGOriginal({ navigation }) {
  const loc = useLocationCascade();
  
  const [ppgList, setPpgList] = useState([]);
  const [ppgLoading, setPpgLoading] = useState(false);
  const [selectedPpg, setSelectedPpg] = useState(null);
  const [ppgSearchText, setPpgSearchText] = useState('');
  const [filteredPpgList, setFilteredPpgList] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  
  // Form state - ALL EMPTY
  const [form, setForm] = useState({
    ppgId: '',  // 🔥 ADD THIS - Store the PPG ID
    ppgName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    signature1: '',
    signature2: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loc.vals.cluster_ccode) {
      setPpgList([]);
      setSelectedPpg(null);
      setFilteredPpgList([]);
      setPpgSearchText('');
      return;
    }
    setPpgLoading(true);
    api.fetchPPGListForOriginal(loc.vals.cluster_ccode)
      .then(data => {
        console.log('📊 PPG data:', data);
        const ppgData = Array.isArray(data) ? data : (data?.data || []);
        const formattedList = ppgData.map(d => ({
          label: d.ppg_name,
          value: String(d.id),
          details: d,
          memberCount: d.member_count || 0
        }));
        setPpgList(formattedList);
        setFilteredPpgList(formattedList);
      })
      .catch(err => {
        console.error('Failed to fetch PPG list:', err);
        Alert.alert('Error', 'Failed to fetch PPG list: ' + err.message);
      })
      .finally(() => setPpgLoading(false));
  }, [loc.vals.cluster_ccode]);

  useEffect(() => {
    if (ppgSearchText.trim() === '') {
      setFilteredPpgList(ppgList);
    } else {
      const filtered = ppgList.filter(item => 
        item.label.toLowerCase().includes(ppgSearchText.toLowerCase())
      );
      setFilteredPpgList(filtered);
    }
  }, [ppgSearchText, ppgList]);

  // Handle PPG selection - Store the ID and name
  const handlePpgSelect = (id) => {
    const selected = ppgList.find(p => p.value === id);
    if (selected) {
      const details = selected.details;
      setSelectedPpg(details);
      
      // 🔥 STORE THE PPG ID for update
      setForm(f => ({ 
        ...f, 
        ppgId: String(id),  // 🔥 Store the ID
        ppgName: details.ppg_name || '',
        accountNumber: '',
        bankName: '',
        ifscCode: '',
        signature1: '',
        signature2: '',
      }));
      
      setPpgSearchText(details.ppg_name);
      setShowDropdown(false);
      setErrors(e => ({ ...e, ppgName: '' }));
    }
  };

  const set = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!loc.vals.state_scode) e.state = 'Select state';
    if (!loc.vals.district_dcode) e.district = 'Select district';
    if (!loc.vals.location_lcode) e.location = 'Select location';
    if (!loc.vals.cluster_ccode) e.cluster = 'Select cluster';
    if (!form.ppgName.trim()) e.ppgName = 'PPG name required';
    if (!ACNO_RE.test(form.accountNumber)) e.accountNumber = 'Must be 9–18 digits';
    if (!form.bankName.trim()) e.bankName = 'Bank name required';
    if (!IFSC_RE.test(form.ifscCode)) e.ifscCode = 'Invalid IFSC (e.g. SBIN0001234)';
    if (!form.signature1.trim()) e.signature1 = 'Required';
    if (!form.signature2.trim()) e.signature2 = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Fix errors', 'Please correct the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      // 🔥 SEND THE PPG ID IF IT EXISTS
      const payload = {
        state_scode: loc.vals.state_scode,
        state_sname: loc.lists.states.find(s => s.value === loc.vals.state_scode)?.label || '',
        district_dcode: loc.vals.district_dcode,
        district_dname: loc.lists.districts.find(d => d.value === loc.vals.district_dcode)?.label || '',
        location_lcode: loc.vals.location_lcode,
        location_lname: loc.lists.locations.find(l => l.value === loc.vals.location_lcode)?.label || '',
        cluster_ccode: loc.vals.cluster_ccode,
        cluster_cname: loc.lists.clusters.find(c => c.value === loc.vals.cluster_ccode)?.label || '',
        ppg_name: form.ppgName.trim(),
        account_number: form.accountNumber.trim(),
        bank_name: form.bankName.trim(),
        ifsc_code: form.ifscCode.toUpperCase().trim(),
        signature1: form.signature1.trim(),
        signature2: form.signature2.trim(),
      };
      
      // 🔥 If we have a PPG ID, send it for update
      if (form.ppgId) {
        payload.ppg_id = parseInt(form.ppgId);
        console.log('🔄 UPDATING PPG ID:', form.ppgId);
      } else {
        console.log('🆕 CREATING NEW PPG');
      }
      
      const response = await api.createPPGOriginal(payload);
      
      Alert.alert('✅ Success', response.message || 'PPG saved successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedPpg(null);
    setPpgSearchText('');
    setForm(f => ({
      ...f,
      ppgId: '',  // 🔥 Clear the ID
      ppgName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      signature1: '',
      signature2: '',
    }));
  };

  return (
    <ScreenShell>
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
        <SectionHeader title="Select Existing PPG" icon="🌿" />
        
        <View style={s.searchContainer}>
          <View style={s.searchWrapper}>
            <TextInput
              ref={searchInputRef}
              style={s.searchInput}
              placeholder="Search PPG name..."
              value={ppgSearchText}
              onChangeText={(text) => {
                setPpgSearchText(text);
                setShowDropdown(true);
                if (text.length > 0) {
                  const exactMatch = ppgList.find(p => 
                    p.label.toLowerCase() === text.toLowerCase()
                  );
                  if (exactMatch) {
                    handlePpgSelect(exactMatch.value);
                  }
                }
              }}
              onFocus={() => setShowDropdown(true)}
              editable={!selectedPpg}
            />
            {selectedPpg && (
              <TouchableOpacity 
                style={s.clearButton}
                onPress={handleClearSelection}
              >
                <Text style={s.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          {errors.ppgName && <Text style={s.errorText}>{errors.ppgName}</Text>}
        </View>

        {showDropdown && ppgSearchText.length > 0 && filteredPpgList.length > 0 && (
          <View style={s.dropdownList}>
            <ScrollView nestedScrollEnabled={true} style={{maxHeight: 200}}>
              {filteredPpgList.map(item => (
                <TouchableOpacity
                  key={item.value}
                  style={s.dropdownItem}
                  onPress={() => handlePpgSelect(item.value)}
                >
                  <View style={s.dropdownItemContent}>
                    <Text style={s.dropdownItemText}>{item.label}</Text>
                    <Text style={s.dropdownItemCode}>{item.details?.ppg_code}</Text>
                  </View>
                  <View style={s.memberCountBadge}>
                    <Text style={s.memberCountText}>👥 {item.memberCount || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {showDropdown && ppgSearchText.length > 0 && filteredPpgList.length === 0 && (
          <View style={s.noResultsContainer}>
            <Text style={s.noResultsText}>No PPG found</Text>
            <Text style={s.noResultsSubText}>You can create a new PPG below</Text>
          </View>
        )}

        

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>{selectedPpg ? 'Selected PPG ' : 'New PPG Details'}</Text>
          <View style={s.dividerLine} />
        </View>

        <FormInput 
          label="PPG Name" 
          required 
          value={form.ppgName}
          onChangeText={set('ppgName')} 
          maxLength={80} 
          error={errors.ppgName}
          editable={false}
          placeholder="Enter PPG name"
        />
      </Card>

      <Card>
        <SectionHeader title="Bank Details" icon="🏦" />
        <FormInput 
          label="Account Number" 
          required 
          value={form.accountNumber}
          onChangeText={set('accountNumber')} 
          keyboardType="numeric"
          maxLength={18} 
          error={errors.accountNumber}
          placeholder="Enter account number (9-18 digits)"
        />
        <FormInput 
          label="Bank Name" 
          required 
          value={form.bankName}
          onChangeText={set('bankName')} 
          maxLength={80} 
          error={errors.bankName}
          placeholder="Enter bank name"
        />
        <FormInput 
          label="IFSC Code" 
          required 
          value={form.ifscCode}
          onChangeText={v => set('ifscCode')(v.toUpperCase())}
          maxLength={11} 
          placeholder="Enter IFSC code (e.g. SBIN0001234)" 
          error={errors.ifscCode} 
        />
      </Card>

      <Card>
        <SectionHeader title="Authorized Signatories" icon="✍️" />
        <View style={s.row}>
          <View style={s.col}>
            <FormInput 
              label="Signatory 1" 
              required 
              value={form.signature1}
              onChangeText={set('signature1')} 
              maxLength={60} 
              error={errors.signature1}
              placeholder="Enter signatory name"
            />
          </View>
          <View style={s.col}>
            <FormInput 
              label="Signatory 2" 
              required 
              value={form.signature2}
              onChangeText={set('signature2')} 
              maxLength={60} 
              error={errors.signature2}
              placeholder="Enter signatory name"
            />
          </View>
        </View>
        <View style={s.sigRow}>
          {[form.signature1 || 'Signatory 1', form.signature2 || 'Signatory 2'].map((sig, i) => (
            <View key={i} style={s.sigBox}>
              <Text style={s.sigName}>{sig || `Signatory ${i + 1}`}</Text>
              <View style={s.sigLine} />
              <Text style={s.sigHint}>Signature</Text>
            </View>
          ))}
        </View>
      </Card>

      <SubmitButton 
        title={selectedPpg ? "Update PPG" : "Create PPG"} 
        onPress={handleSubmit} 
        loading={saving} 
      />
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  searchContainer: {
    marginBottom: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    borderRadius: 8,
  },
  clearButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 4,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemCode: {
    fontSize: 12,
    color: '#666',
  },
  memberCountBadge: {
    backgroundColor: theme.greenPale,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.greenBorder,
  },
  memberCountText: {
    fontSize: 12,
    color: theme.green,
    fontWeight: '500',
  },
  noResultsContainer: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  noResultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  noResultsSubText: {
    fontSize: 12,
    color: '#999',
  },
  selectedPpgInfo: {
    marginTop: 10,
    padding: 12,
    backgroundColor: theme.greenPale,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.green,
    marginBottom: 10,
  },
  selectedPpgTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.green,
    marginBottom: 6,
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
  errorText: {
    color: theme.error,
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 12,
    color: theme.muted,
    fontSize: 12,
  },
  row: { 
    flexDirection: 'row', 
    gap: 10 
  },
  col: { 
    flex: 1 
  },
  sigRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 8 
  },
  sigBox: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 14,
    backgroundColor: theme.greenPale, 
    borderRadius: 8,
    borderWidth: 1, 
    borderColor: theme.greenBorder, 
    borderStyle: 'dashed' 
  },
  sigName: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: theme.green 
  },
  sigLine: { 
    width: '70%', 
    height: 1.5, 
    backgroundColor: theme.green, 
    marginVertical: 8 
  },
  sigHint: { 
    fontSize: 10, 
    color: theme.muted, 
    letterSpacing: 0.5 
  },
});