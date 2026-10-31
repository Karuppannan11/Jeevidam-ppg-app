// src/screens/FPOMemberScreen.js
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  ScreenShell, Card, SectionHeader, Dropdown,
  MultiSelect, SubmitButton, theme, useLocationCascade,
} from '../components/SharedComponents';
import * as api from '../api/api';

export default function FPOMemberScreen({ navigation }) {
  const loc = useLocationCascade();

  const [ppgList, setPpgList]   = useState([]);
  const [ppgId, setPpgId]       = useState('');
  const [ppgLoading, setPpgLoad] = useState(false);

  const [memberList, setMembers]     = useState([]);
  const [selectedMembers, setSelected] = useState([]);
  const [memberLoading, setMemberLoad] = useState(false);

  const [errors, setErrors] = useState({});
  const [saving, setSaving]  = useState(false);

  useEffect(() => {
    if (!loc.vals.cluster_ccode) { setPpgList([]); setPpgId(''); return; }
    setPpgLoad(true);
    api.fetchPPGList(loc.vals.cluster_ccode)
      .then(data => setPpgList(data.map(d => ({ label: d.ppg_name, value: String(d.id) }))))
      .catch(() => {}).finally(() => setPpgLoad(false));
  }, [loc.vals.cluster_ccode]);

  // When group changes → load members
  useEffect(() => {
    if (!loc.vals.group_gcode) { setMembers([]); setSelected([]); return; }
    setMemberLoad(true);
    api.fetchMembers(loc.vals.group_gcode)
      .then(data => setMembers(data.map(d => ({
        label: `${d.member_mcode} — ${d.unique_id}`,
        value: String(d.id),
      }))))
      .catch(() => {}).finally(() => setMemberLoad(false));
  }, [loc.vals.group_gcode]);

  const toggleMember = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    setErrors(e => ({ ...e, members: '' }));
  };

  const validate = () => {
    const e = {};
    if (!loc.vals.state_scode)    e.state    = 'Required';
    if (!loc.vals.district_dcode) e.district = 'Required';
    if (!loc.vals.location_lcode) e.location = 'Required';
    if (!loc.vals.cluster_ccode)  e.cluster  = 'Required';
    if (!ppgId)                   e.ppgId    = 'Select a PPG';
    if (!loc.vals.group_gcode)    e.group    = 'Select a group';
    if (selectedMembers.length === 0) e.members = 'Select at least one member';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) { Alert.alert('Fix errors', 'Complete all fields.'); return; }
    setSaving(true);
    try {
      await api.createFPOMembers({
        state_scode:    loc.vals.state_scode,
        district_dcode: loc.vals.district_dcode,
        location_lcode: loc.vals.location_lcode,
        cluster_ccode:  loc.vals.cluster_ccode,
        ppg_id:         ppgId,
        group_gcode:    loc.vals.group_gcode,
        member_ids:     selectedMembers,
      });
      Alert.alert('✅ Saved', `${selectedMembers.length} member(s) linked to FPO.`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
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
        <SectionHeader title="PPG (from Master)" icon="🌿" />
        <Dropdown label="PPG" required value={ppgId}
          items={ppgList} loading={ppgLoading}
          disabled={!loc.vals.cluster_ccode}
          onSelect={(id) => { setPpgId(id); setErrors(e => ({ ...e, ppgId:'' })); }}
          error={errors.ppgId}
          placeholder={loc.vals.cluster_ccode ? 'Select PPG' : 'Select cluster first'} />
      </Card>

      <Card>
        <SectionHeader title="Group & Members" icon="👥" />
        <Dropdown label="Group" required value={loc.vals.group_gcode}
          items={loc.lists.groups} loading={loc.loading.groups}
          disabled={!loc.vals.cluster_ccode} onSelect={loc.onGroup} error={errors.group} />

        {loc.vals.group_gcode && memberList.length > 0 && (
          <View style={s.actions}>
            <TouchableOpacity onPress={() => setSelected(memberList.map(m => m.value))}>
              <Text style={s.actionBtn}>Select All ({memberList.length})</Text>
            </TouchableOpacity>
            <Text style={s.sep}>·</Text>
            <TouchableOpacity onPress={() => setSelected([])}>
              <Text style={[s.actionBtn, { color: theme.error }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <MultiSelect label="Members" required
          items={memberList} selected={selectedMembers}
          onToggle={toggleMember} loading={memberLoading}
          disabled={!loc.vals.group_gcode} error={errors.members} />

        {selectedMembers.length > 0 && (
          <View style={s.summary}>
            <Text style={s.summaryText}>
              ✓ {selectedMembers.length} of {memberList.length} selected
            </Text>
          </View>
        )}
      </Card>

      <SubmitButton title="Add FPO Members" onPress={handleSubmit} loading={saving} />
    </ScreenShell>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  actionBtn: { fontSize: 12, color: theme.green, fontWeight: '600' },
  sep: { marginHorizontal: 8, color: theme.muted },
  summary: { marginTop: 10, padding: 12, backgroundColor: theme.greenPale,
    borderRadius: 8, borderLeftWidth: 3, borderLeftColor: theme.green },
  summaryText: { fontSize: 13, fontWeight: '600', color: theme.green },
});