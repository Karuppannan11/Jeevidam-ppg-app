// src/screens/FPOOriginal.js
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet } from 'react-native';
import {
  ScreenShell, Card, SectionHeader, FormInput,
  Dropdown, SubmitButton, theme, useLocationCascade,
} from '../components/SharedComponents';
import { generateFPOCode, createFPOOriginal } from '../api/api';

export default function FPOOriginal({ navigation }) {
  const loc = useLocationCascade();
  const [form, setForm] = useState({
    fpoCode: '',
    fpoName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    signature1: '',
    signature2: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingCode, setLoadingCode] = useState(false);

  // Generate FPO code on mount
  useEffect(() => {
    generateCode();
  }, []);

  const generateCode = async () => {
    setLoadingCode(true);
    try {
      const response = await generateFPOCode();
      console.log('FPO Code response:', response);
      setForm(prev => ({ ...prev, fpoCode: response.code }));
    } catch (error) {
      console.error('Error generating FPO code:', error);
      Alert.alert('Error', 'Failed to generate FPO code');
    } finally {
      setLoadingCode(false);
    }
  };

  const set = (key) => (val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!loc.vals.state_scode)    e.state    = 'Select state';
    if (!loc.vals.district_dcode) e.district = 'Select district';
    if (!loc.vals.location_lcode) e.location = 'Select location';
    if (!loc.vals.cluster_ccode)  e.cluster  = 'Select cluster';
    if (!form.fpoName.trim())     e.fpoName  = 'FPO name required';
    if (!form.accountNumber.trim() || !/^\d{9,18}$/.test(form.accountNumber)) 
      e.accountNumber = 'Must be 9–18 digits';
    if (!form.bankName.trim())    e.bankName = 'Bank name required';
    if (!form.ifscCode.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode)) 
      e.ifscCode = 'Invalid IFSC (e.g. SBIN0001234)';
    if (!form.signature1.trim())  e.signature1 = 'Required';
    if (!form.signature2.trim())  e.signature2 = 'Required';
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
      await createFPOOriginal({
        state_scode:    loc.vals.state_scode,
        district_dcode: loc.vals.district_dcode,
        location_lcode: loc.vals.location_lcode,
        cluster_ccode:  loc.vals.cluster_ccode,
        fpo_code:       form.fpoCode,
        fpo_name:       form.fpoName.trim(),
        account_number: form.accountNumber.trim(),
        bank_name:      form.bankName.trim(),
        ifsc_code:      form.ifscCode.toUpperCase().trim(),
        signature1:     form.signature1.trim(),
        signature2:     form.signature2.trim(),
      });
      Alert.alert('✅ Success', 'FPO registered successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      console.error('Error creating FPO:', err);
      Alert.alert('Error', err.message || 'Failed to create FPO');
    } finally {
      setSaving(false);
    }
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
        <SectionHeader title="FPO Information" icon="🏢" />
        {/* <FormInput label="FPO Code" value={form.fpoCode}
          onChangeText={set('fpoCode')} editable={false} 
          placeholder={loadingCode ? 'Generating...' : 'Auto-generated'} /> */}
        <FormInput label="FPO Name" required value={form.fpoName}
          onChangeText={set('fpoName')} maxLength={100} error={errors.fpoName} />
      </Card>

      <Card>
        <SectionHeader title="Bank Details" icon="🏦" />
        <FormInput label="Account Number" required value={form.accountNumber}
          onChangeText={set('accountNumber')} keyboardType="numeric"
          maxLength={18} error={errors.accountNumber} />
        <FormInput label="Bank Name" required value={form.bankName}
          onChangeText={set('bankName')} maxLength={80} error={errors.bankName} />
        <FormInput label="IFSC Code" required value={form.ifscCode}
          onChangeText={v => set('ifscCode')(v.toUpperCase())}
          maxLength={11} placeholder="e.g. SBIN0001234" error={errors.ifscCode} />
      </Card>

      <Card>
        <SectionHeader title="Authorized Signatories" icon="✍️" />
        <View style={s.row}>
          <View style={s.col}>
            <FormInput label="Signatory 1" required value={form.signature1}
              onChangeText={set('signature1')} maxLength={60} error={errors.signature1} />
          </View>
          <View style={s.col}>
            <FormInput label="Signatory 2" required value={form.signature2}
              onChangeText={set('signature2')} maxLength={60} error={errors.signature2} />
          </View>
        </View>
        <View style={s.sigRow}>
          {[form.signature1||'Signatory 1', form.signature2||'Signatory 2'].map((sig, i) => (
            <View key={i} style={s.sigBox}>
              <Text style={s.sigName}>{sig}</Text>
              <View style={s.sigLine} />
              <Text style={s.sigHint}>Signature</Text>
            </View>
          ))}
        </View>
      </Card>

      <SubmitButton title="Create FPO" onPress={handleSubmit} loading={saving} />
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  sigRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  sigBox: { flex: 1, alignItems: 'center', paddingVertical: 14,
    backgroundColor: theme.greenPale, borderRadius: 8,
    borderWidth: 1, borderColor: theme.greenBorder, borderStyle: 'dashed' },
  sigName: { fontSize: 12, fontWeight: '600', color: theme.green },
  sigLine: { width: '70%', height: 1.5, backgroundColor: theme.green, marginVertical: 8 },
  sigHint: { fontSize: 10, color: theme.muted, letterSpacing: 0.5 },
});